import { NumField, SegField, Msg, Result, Toolbar, ClearButton, ShareButton, usePersist, parseNum, fmt } from '../shared'

const FACTORS = { dsDNA: 50, RNA: 40, ssDNA: 33 } // ng/µL per A260 unit at 1 cm
const INITIAL = { molecule: 'dsDNA', factor: '', a260: '', dilution: '1', path: '1', a280: '', a230: '', elution: '' }
const LOW_SIGNAL = 0.1

function purity(molecule, r280, r230) {
  const notes = []
  const target = molecule === 'RNA' ? 2.0 : 1.8
  if (r280 !== null) {
    if (r280 < target - 0.1) notes.push(`260/280 of ${fmt(r280, 3)} is low (expected about ${target}): possible protein or phenol carryover.`)
    else if (r280 > target + 0.2) notes.push(`260/280 of ${fmt(r280, 3)} is high: check the blank, or RNA contamination in DNA.`)
  }
  if (r230 !== null && r230 < 1.8) {
    notes.push(`260/230 of ${fmt(r230, 3)} is low (expected 2.0–2.2): possible guanidine salt, phenol, EDTA, or carbohydrate carryover.`)
  }
  return notes
}

export default function A260() {
  const [s, set, reset] = usePersist('a260', INITIAL)
  const a260 = parseNum(s.a260)
  const dilution = parseNum(s.dilution)
  const path = parseNum(s.path)
  const a280 = parseNum(s.a280)
  const a230 = parseNum(s.a230)
  const elution = parseNum(s.elution)
  const factor = s.molecule === 'Custom' ? parseNum(s.factor) : FACTORS[s.molecule]

  let res = null
  let error = null
  if (a260 !== null) {
    if (!(a260 > 0) || !(dilution >= 1) || !(path > 0) || !(factor > 0)) error = 'Check the values: absorbance, path length, and factor must be greater than zero; dilution at least 1.'
    else {
      const conc = (a260 * factor * dilution) / path
      res = {
        conc,
        r280: a280 > 0 ? a260 / a280 : null,
        r230: a230 > 0 ? a260 / a230 : null,
        yieldUg: elution > 0 ? (conc * elution) / 1000 : null,
      }
    }
  }
  const notes = res ? purity(s.molecule, res.r280, res.r230) : []

  return (
    <div>
      <SegField label="Molecule" value={s.molecule} options={[...Object.keys(FACTORS), 'Custom']} onChange={(molecule) => set({ molecule })} />
      {s.molecule === 'Custom' && <NumField label="Factor (ng/µL per A260)" value={s.factor} onChange={(v) => set({ factor: v })} hint="For oligos, use the factor from the synthesis report." />}
      <div className="grid-2">
        <NumField label="A260" value={s.a260} onChange={(v) => set({ a260: v })} />
        <NumField label="Dilution Factor" value={s.dilution} onChange={(v) => set({ dilution: v })} presets={[1, 10, 50]} />
        <NumField label="A280 (optional)" value={s.a280} onChange={(v) => set({ a280: v })} />
        <NumField label="A230 (optional)" value={s.a230} onChange={(v) => set({ a230: v })} />
        <NumField label="Path Length (cm)" value={s.path} onChange={(v) => set({ path: v })} hint="NanoDrop values are already normalized to 1 cm." />
        <NumField label="Elution Volume (µL, optional)" value={s.elution} onChange={(v) => set({ elution: v })} />
      </div>

      {a260 === null && <Msg>Enter the A260 reading.</Msg>}
      {error && <Msg kind="error">{error}</Msg>}
      {res && (
        <Result>
          <div className="result-label">CONCENTRATION</div>
          <div className="result-value">{fmt(res.conc)} ng/µL</div>
          <div className="result-sub">
            {[res.r280 !== null && `260/280 ${fmt(res.r280, 3)}`, res.r230 !== null && `260/230 ${fmt(res.r230, 3)}`, res.yieldUg !== null && `yield ${fmt(res.yieldUg)} µg`].filter(Boolean).join(' · ')}
          </div>
          <div className="result-note">A260 × {fmt(factor)} × dilution ÷ path length</div>
        </Result>
      )}
      {res && a260 < LOW_SIGNAL && <Msg kind="warn">Readings below A260 {LOW_SIGNAL} are unreliable; use less dilution or a more concentrated sample.</Msg>}
      {notes.map((n) => <Msg key={n} kind="warn">{n}</Msg>)}
      <Toolbar><ShareButton toolKey="a260" state={s} /><ClearButton onClick={reset} /></Toolbar>
    </div>
  )
}
