import { useState } from 'react'
import { NumField, SegField, TextField, Msg, Result, Toolbar, CopyButton, ClearButton, ShareButton, usePersist, parseNum, useToolLink, shareQuery, tsv } from '../shared'

const INITIAL = {
  samples: '', targets: '2', replicates: '3', standards: '0', ntc: '3', plate: '96', chemistry: 'sybr', fill: 'rows',
  targetNames: '', sampleNames: '',
}
const PLATES = { 96: { rows: 8, cols: 12 }, 384: { rows: 16, cols: 24 } }
const COLORS = ['#8ecae6', '#ffb703', '#90be6d', '#f28482', '#cdb4db', '#f6bd60', '#84a59d', '#a2d2ff']
const ROW_LETTERS = 'ABCDEFGHIJKLMNOP'

const splitNames = (text) => text.split(/[,\n]/).map((x) => x.trim()).filter(Boolean)

function check(s) {
  const v = Object.fromEntries(['samples', 'targets', 'replicates', 'standards', 'ntc'].map((k) => [k, parseNum(s[k])]))
  if (v.samples === null) return { hint: 'Enter the number of samples.' }
  if (Object.values(v).some((x) => x === null || !Number.isInteger(x) || x < 0)) return { error: 'Use whole numbers of zero or more.' }
  if (v.samples < 1 || v.targets < 1 || v.replicates < 1) return { error: 'Samples, targets, and replicates must be at least 1.' }
  return { v }
}

/** Wells for each target: samples, then standards, then NTCs, with replicates side by side. */
function targetWells(v, targetNames, sampleNames) {
  return Array.from({ length: v.targets }, (_, t) => {
    const name = targetNames[t] || `Target ${t + 1}`
    const wells = []
    for (let i = 0; i < v.samples; i++) {
      const sample = sampleNames[i] || `Sample ${i + 1}`
      for (let r = 0; r < v.replicates; r++) wells.push({ short: String(i + 1), detail: `${sample}, rep ${r + 1}` })
    }
    for (let i = 0; i < v.standards; i++) {
      for (let r = 0; r < v.replicates; r++) wells.push({ short: `S${i + 1}`, detail: `Standard ${i + 1}, rep ${r + 1}` })
    }
    for (let i = 0; i < v.ntc; i++) wells.push({ short: 'N', detail: `NTC ${i + 1}` })
    return { name, color: COLORS[t % COLORS.length], wells }
  })
}

/**
 * Places wells plate by plate without splitting a target unless it is larger than a plate.
 * `aligned`: each target starts on a new row (or column) for readability.
 */
function place(targets, size, fill, aligned) {
  const { rows, cols } = PLATES[size]
  const lineLen = fill === 'rows' ? cols : rows
  const capacity = rows * cols
  const plates = []
  let plate = null
  let pos = capacity
  let split = false
  for (const target of targets) {
    const n = target.wells.length
    if (aligned) pos = Math.ceil(pos / lineLen) * lineLen
    if (pos + Math.min(n, capacity) > capacity) { plate = { wells: {} }; plates.push(plate); pos = 0 }
    for (const w of target.wells) {
      if (pos >= capacity) { split = true; plate = { wells: {} }; plates.push(plate); pos = 0 }
      const line = Math.floor(pos / lineLen)
      const offset = pos % lineLen
      const [r, c] = fill === 'rows' ? [line, offset] : [offset, line]
      plate.wells[`${r},${c}`] = { ...w, target }
      pos++
    }
  }
  return { plates, rows, cols, split }
}

/** Aligned layout when it needs no extra plates, otherwise packed tightly. */
function layout(targets, size, fill) {
  const aligned = place(targets, size, fill, true)
  const packed = place(targets, size, fill, false)
  return aligned.plates.length <= packed.plates.length ? aligned : packed
}

function PlateMap({ plate, index, rows, cols, size, onPick }) {
  const cell = 30
  const pad = 22
  const small = size === '384'
  const used = Object.keys(plate.wells).length
  return (
    <figure className="plate">
      <figcaption className="field-label">Plate {index + 1} · {used} of {rows * cols} wells</figcaption>
      <svg viewBox={`0 0 ${pad + cols * cell} ${pad + rows * cell}`} role="img"
        aria-label={`Plate ${index + 1} layout with ${used} filled wells`}>
        {Array.from({ length: cols }, (_, c) => (
          <text key={`c${c}`} x={pad + c * cell + cell / 2} y={14} className="plate-axis">{c + 1}</text>
        ))}
        {Array.from({ length: rows }, (_, r) => (
          <text key={`r${r}`} x={9} y={pad + r * cell + cell / 2 + 4} className="plate-axis">{ROW_LETTERS[r]}</text>
        ))}
        {Array.from({ length: rows * cols }, (_, k) => {
          const r = Math.floor(k / cols)
          const c = k % cols
          const w = plate.wells[`${r},${c}`]
          const cx = pad + c * cell + cell / 2
          const cy = pad + r * cell + cell / 2
          return (
            <g key={k}>
              <circle cx={cx} cy={cy} r={cell / 2 - 2} className={w ? 'well well-on' : 'well'} style={w ? { fill: w.target.color } : undefined}
                onClick={() => onPick(w ? `Plate ${index + 1}, ${ROW_LETTERS[r]}${c + 1}: ${w.target.name}, ${w.detail}` : `Plate ${index + 1}, ${ROW_LETTERS[r]}${c + 1}: empty`)}>
                <title>{w ? `${ROW_LETTERS[r]}${c + 1}: ${w.target.name}, ${w.detail}` : `${ROW_LETTERS[r]}${c + 1}: empty`}</title>
              </circle>
              {w && !small && <text x={cx} y={cy + 4} className="well-text">{w.short}</text>}
            </g>
          )
        })}
      </svg>
    </figure>
  )
}

export default function QpcrPlate() {
  const [s, set, reset] = usePersist('qpcr', INITIAL)
  const hrefFor = useToolLink()
  const [picked, setPicked] = useState('')
  const { v, hint, error } = check(s)

  const setNames = (key, countKey) => (text) => {
    const n = splitNames(text).length
    set(n ? { [key]: text, [countKey]: String(n) } : { [key]: text })
  }

  let plan = null
  if (v) {
    const targets = targetWells(v, splitNames(s.targetNames), splitNames(s.sampleNames))
    const map = layout(targets, s.plate, s.fill)
    plan = { perTarget: targets[0].wells.length, total: targets[0].wells.length * v.targets, targets, ...map }
  }
  const mixLink = plan && hrefFor('mastermix', shareQuery('mastermix', { template: s.chemistry, n: String(plan.perTarget) }))
  const plateText = plan && plan.plates.map((p, i) => tsv([
    [`Plate ${i + 1}`, ...Array.from({ length: plan.cols }, (_, c) => c + 1)],
    ...Array.from({ length: plan.rows }, (_, r) => [
      ROW_LETTERS[r],
      ...Array.from({ length: plan.cols }, (_, c) => {
        const w = p.wells[`${r},${c}`]
        return w ? `${w.target.name}: ${w.detail}` : ''
      }),
    ]),
  ])).join('\n\n')

  return (
    <div>
      <div className="grid-2">
        <NumField label="Samples" value={s.samples} onChange={(x) => set({ samples: x })} />
        <NumField label="Targets (genes)" value={s.targets} onChange={(x) => set({ targets: x })} hint="Include reference genes." />
        <NumField label="Replicates" value={s.replicates} onChange={(x) => set({ replicates: x })} presets={[2, 3]} />
        <NumField label="Standard Points" value={s.standards} onChange={(x) => set({ standards: x })} hint="Dilution series for efficiency; 0 if none." />
        <NumField label="NTC Wells per Target" value={s.ntc} onChange={(x) => set({ ntc: x })} presets={[1, 2, 3]} />
      </div>
      <TextField label="Target Names (optional)" value={s.targetNames} onChange={setNames('targetNames', 'targets')} placeholder="e.g. GAPDH, ACTB, IL6" />
      <TextField label="Sample Names (optional)" value={s.sampleNames} onChange={setNames('sampleNames', 'samples')} placeholder="e.g. WT1, WT2, KO1" />
      <SegField label="Plate" value={s.plate} options={[{ value: '96', label: '96-well' }, { value: '384', label: '384-well' }]} onChange={(plate) => set({ plate })} />
      <SegField label="Fill" value={s.fill} options={[{ value: 'rows', label: 'By Rows' }, { value: 'cols', label: 'By Columns' }]} onChange={(fill) => set({ fill })} />
      <SegField label="Chemistry" value={s.chemistry} options={[{ value: 'sybr', label: 'SYBR Green' }, { value: 'taqman', label: 'Probe' }]} onChange={(chemistry) => set({ chemistry })} />

      {hint && <Msg>{hint}</Msg>}
      {error && <Msg kind="error">{error}</Msg>}
      {plan && (
        <Result>
          <div className="result-label">REACTIONS PER TARGET</div>
          <div className="result-value">{plan.perTarget}</div>
          <div className="result-sub">
            {plan.total} wells on {plan.plates.length} {s.plate}-well {plan.plates.length === 1 ? 'plate' : 'plates'}
          </div>
          <div className="result-note">(samples + standards) × replicates + NTC, for each target</div>
        </Result>
      )}
      {plan?.split && <Msg kind="warn">A target does not fit on one plate and is split across plates; compare Cq values across plates with care.</Msg>}
      {plan && (
        <>
          <ul className="legend" aria-label="Targets">
            {plan.targets.map((t) => (
              <li key={t.name}><span className="swatch" style={{ background: t.color }} aria-hidden="true" />{t.name}</li>
            ))}
          </ul>
          {plan.plates.map((p, i) => <PlateMap key={i} plate={p} index={i} rows={plan.rows} cols={plan.cols} size={s.plate} onPick={setPicked} />)}
          <p className="field-hint" role="status" aria-live="polite">
            {picked || 'Numbers are samples, S1… standards, N no-template controls. Tap a well for details.'}
          </p>
          <Toolbar>
            <a className="btn btn-primary" href={mixLink}>Open Master Mix for {plan.perTarget} Reactions</a>
          </Toolbar>
        </>
      )}
      <Toolbar>
        {plan && <CopyButton text={plateText} label="Copy Plate Map" />}
        <ShareButton toolKey="qpcr" state={s} />
        <ClearButton onClick={reset} label="Reset" />
      </Toolbar>
    </div>
  )
}
