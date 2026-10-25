import { useEffect, useId } from 'react'
import { NumField, SelectField, TextField, Units, Msg, Toolbar, CopyButton, ClearButton, ShareButton, usePersist, parseNum, fmt, fmtVol, tsv, MIN_PIPETTE_UL } from '../shared'
import { MIX_TEMPLATES } from '../data'

const KINDS = [
  { value: 'conc', label: 'Stock → Final' },
  { value: 'fixed', label: 'Fixed µL per rxn' },
  { value: 'tube', label: 'Added per tube' },
  { value: 'fill', label: 'Water (fills up)' },
]
const CONC_UNITS = ['×', 'µM', 'mM', 'nM', 'U/µL', 'ng/µL', '%']

const fromTemplate = (t) => ({ rxnVol: t.rxnVol, components: t.components.map((c) => ({ ...c })) })

const INITIAL = {
  template: 'pcr', n: '8', extra: '10', saveName: '',
  ...fromTemplate(MIX_TEMPLATES.pcr),
  loadedTemplate: 'pcr',
  saved: {},
}

function templateFor(s, key) {
  if (MIX_TEMPLATES[key]) return MIX_TEMPLATES[key]
  if (s.saved[key]) return s.saved[key]
  return null
}

/** Volume per reaction of each component, the water fill, and any errors. */
function compute(s) {
  const n = parseNum(s.n)
  const extra = parseNum(s.extra)
  const rv = parseNum(s.rxnVol)
  if (n === null || extra === null || rv === null) return { error: 'Fill in reactions, extra %, and reaction volume.' }
  if (!Number.isInteger(n) || n < 1) return { error: 'Number of reactions must be a whole number of at least 1.' }
  if (Number.isNaN(extra) || extra < 0) return { error: 'Extra % must be zero or more.' }
  if (!(rv > 0)) return { error: 'Reaction volume must be greater than zero.' }
  if (s.components.filter((c) => c.kind === 'fill').length > 1) return { error: 'Only one component can be the water fill.' }

  const rows = []
  for (const c of s.components) {
    const label = c.name.trim() || 'Unnamed component'
    if (c.kind === 'conc') {
      const stock = parseNum(c.stock)
      const final = parseNum(c.final)
      if (!(stock > 0) || !(final > 0)) return { error: `${label}: enter stock and final concentrations greater than zero.` }
      if (final >= stock) return { error: `${label}: the final concentration must be lower than the stock.` }
      rows.push({ ...c, label, perRxn: (final / stock) * rv })
    } else if (c.kind === 'fixed' || c.kind === 'tube') {
      const vol = parseNum(c.vol)
      if (vol === null || Number.isNaN(vol) || vol < 0) return { error: `${label}: enter a volume of zero or more.` }
      rows.push({ ...c, label, perRxn: vol })
    } else {
      rows.push({ ...c, label, perRxn: 0 })
    }
  }
  const used = rows.filter((r) => r.kind !== 'fill').reduce((sum, r) => sum + r.perRxn, 0)
  const fill = rows.find((r) => r.kind === 'fill')
  if (fill) fill.perRxn = rv - used
  const total = n * (1 + extra / 100)
  const mix = rows.filter((r) => r.kind !== 'tube')
  const tube = rows.filter((r) => r.kind === 'tube')
  return {
    n, total, rv, mix, tube,
    aliquot: mix.reduce((sum, r) => sum + r.perRxn, 0),
    overfull: fill ? fill.perRxn < 0 : used > rv + 1e-9,
    sumOff: !fill && Math.abs(used - rv) > 1e-9,
  }
}

function ComponentRow({ c, onChange, onRemove }) {
  const id = useId()
  return (
    <div className="mm-row">
      <div className="mm-head">
        <input className="input" aria-label="Component name" value={c.name} onChange={(e) => onChange({ name: e.target.value })} />
        <select className="select" aria-label={`${c.name || 'Component'} type`} value={c.kind} onChange={(e) => onChange({ kind: e.target.value })}>
          {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
        <button type="button" className="btn btn-icon" aria-label={`Remove ${c.name || 'component'}`} onClick={onRemove}>×</button>
      </div>
      {c.kind === 'conc' && (
        <div className="mm-body">
          <label htmlFor={`${id}s`}>Stock</label>
          <input id={`${id}s`} className="input" inputMode="decimal" value={c.stock ?? ''} onChange={(e) => onChange({ stock: e.target.value })} />
          <label htmlFor={`${id}f`}>Final</label>
          <input id={`${id}f`} className="input" inputMode="decimal" value={c.final ?? ''} onChange={(e) => onChange({ final: e.target.value })} />
          <select className="select" aria-label={`${c.name || 'Component'} unit`} value={c.unit ?? '×'} onChange={(e) => onChange({ unit: e.target.value })}>
            {CONC_UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
      )}
      {(c.kind === 'fixed' || c.kind === 'tube') && (
        <div className="mm-body">
          <label htmlFor={`${id}v`}><Units>Volume (µL)</Units></label>
          <input id={`${id}v`} className="input" inputMode="decimal" value={c.vol ?? ''} onChange={(e) => onChange({ vol: e.target.value })} />
        </div>
      )}
      {c.kind === 'fill' && <div className="mm-note">Fills each reaction up to the reaction volume.</div>}
    </div>
  )
}

export default function MasterMix() {
  const [s, set] = usePersist('mastermix', INITIAL)

  useEffect(() => {
    if (s.loadedTemplate === s.template) return
    const t = templateFor(s, s.template)
    if (t) set({ ...fromTemplate(t), loadedTemplate: s.template })
  }, [s.template])

  const r = compute(s)
  const setComponent = (i, patch) => set({ components: s.components.map((c, j) => (j === i ? { ...c, ...patch } : c)) })
  const loadTemplate = (key) => set({ template: key, ...fromTemplate(templateFor(s, key)), loadedTemplate: key })
  const saveTemplate = () => {
    const name = s.saveName.trim()
    const key = `saved:${name}`
    set({ saved: { ...s.saved, [key]: { name, rxnVol: s.rxnVol, components: s.components } }, template: key, loadedTemplate: key, saveName: '' })
  }
  const removeSaved = () => {
    const { [s.template]: _, ...rest } = s.saved
    set({ saved: rest })
    loadTemplate('pcr')
  }
  const options = [
    ...Object.entries(MIX_TEMPLATES).map(([value, t]) => ({ value, label: t.name })),
    ...Object.entries(s.saved).map(([value, t]) => ({ value, label: `★ ${t.name}` })),
  ]
  const ready = r.mix && !r.overfull
  const text = ready && tsv([
    ['Component', 'Per rxn (µL)', `×${fmt(r.total, 3)} (µL)`],
    ...r.mix.map((c) => [c.label, fmtVol(c.perRxn), fmtVol(c.perRxn * r.total)]),
    ['Master mix total', fmtVol(r.aliquot), fmtVol(r.aliquot * r.total)],
    ...r.tube.map((c) => [`${c.label} (per tube)`, fmtVol(c.perRxn), '']),
  ])

  return (
    <div>
      <SelectField label="Template" value={s.template} onChange={loadTemplate} options={options} />
      <div className="grid-3">
        <NumField label="# Reactions" value={s.n} onChange={(n) => set({ n })} />
        <NumField label="Extra %" value={s.extra} onChange={(extra) => set({ extra })} presets={[0, 10]} presetSuffix="%" />
        <NumField label="Rxn Vol (µL)" value={s.rxnVol} onChange={(rxnVol) => set({ rxnVol })} />
      </div>

      <div className="field-label" style={{ marginTop: 8 }}>Components</div>
      {s.components.map((c, i) => (
        <ComponentRow key={i} c={c} onChange={(patch) => setComponent(i, patch)}
          onRemove={() => set({ components: s.components.filter((_, j) => j !== i) })} />
      ))}
      <Toolbar>
        <button type="button" className="btn" onClick={() => set({ components: [...s.components, { name: '', kind: 'fixed', vol: '1' }] })}>Add Component</button>
      </Toolbar>

      {r.error && <Msg kind="error">{r.error}</Msg>}
      {r.overfull && <Msg kind="error">The components exceed the reaction volume. Lower some volumes or raise the reaction volume.</Msg>}
      {ready && (
        <div style={{ marginTop: 16, overflowX: 'auto' }}>
          <table className="table">
            <thead><tr><th>Master Mix</th><th><Units>Per rxn (µL)</Units></th><th>×{fmt(r.total, 3)} <Units>(µL)</Units></th></tr></thead>
            <tbody>
              {r.mix.map((c, i) => (
                <tr key={i}><td>{c.label}</td><td>{fmtVol(c.perRxn)}</td><td className="highlight">{fmtVol(c.perRxn * r.total)}</td></tr>
              ))}
              <tr><td className="total">Total</td><td className="total">{fmtVol(r.aliquot)}</td><td className="total">{fmtVol(r.aliquot * r.total)}</td></tr>
            </tbody>
          </table>
          <ol className="steps">
            <li>Combine the components above into one master mix.</li>
            <li>Pipette <strong>{fmtVol(r.aliquot)} µL</strong> master mix into each of {r.n} tubes.</li>
            {r.tube.map((c, i) => <li key={i}>Add <strong>{fmtVol(c.perRxn)} µL</strong> {c.label} to each tube.</li>)}
          </ol>
          {r.sumOff && <Msg kind="warn">Without a water fill, the components add up to {fmtVol(r.aliquot + r.tube.reduce((x, c) => x + c.perRxn, 0))} µL, not {fmtVol(r.rv)} µL.</Msg>}
          {r.tube.some((c) => c.perRxn > 0 && c.perRxn < MIN_PIPETTE_UL) && (
            <Msg kind="warn">Below {MIN_PIPETTE_UL} µL, pipetting is inaccurate. Dilute the sample and add a larger volume instead.</Msg>
          )}
        </div>
      )}

      <div className="row save-row" style={{ marginTop: 24 }}>
        <TextField label="Save as Template" value={s.saveName} onChange={(saveName) => set({ saveName })} placeholder="e.g. My qPCR" />
        <button type="button" className="btn" disabled={!s.saveName.trim()} onClick={saveTemplate}>Save</button>
      </div>
      <Toolbar>
        {ready && <CopyButton text={text} />}
        <ShareButton toolKey="mastermix" state={s} />
        {s.saved[s.template] && <button type="button" className="btn" onClick={removeSaved}>Delete Template</button>}
        <ClearButton onClick={() => loadTemplate(s.template)} label="Reset" />
      </Toolbar>
    </div>
  )
}
