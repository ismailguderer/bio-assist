import { Units, NumField, SelectField, Msg, Toolbar, CopyButton, ClearButton, usePersist, parseNum, fmt, fmtVol, tsv, MIN_PIPETTE_UL } from '../shared'

const INITIAL = { n: '8', extra: '10', rxnVol: '25', mmX: '2', primerStock: '10', primerFinal: '0.5', template: '1' }

function check(s) {
  const v = Object.fromEntries(Object.keys(INITIAL).map((k) => [k, parseNum(s[k])]))
  if (Object.values(v).some((x) => x === null)) return { error: 'Fill in all fields.' }
  if (Object.values(v).some((x) => Number.isNaN(x))) return { error: 'Enter numbers only.' }
  if (!Number.isInteger(v.n) || v.n < 1) return { error: 'Number of reactions must be a whole number of at least 1.' }
  if (v.extra < 0) return { error: 'Extra % cannot be negative.' }
  if (v.rxnVol <= 0 || v.primerStock <= 0 || v.primerFinal <= 0) return { error: 'Volumes and concentrations must be greater than zero.' }
  if (v.template < 0) return { error: 'Template volume cannot be negative.' }
  if (v.primerFinal >= v.primerStock) return { error: 'Primer final concentration must be lower than the stock.' }
  return { v }
}

export default function PCRMix() {
  const [s, set, reset] = usePersist('pcr', INITIAL)
  const { v, error } = check(s)

  let mix = null
  if (v) {
    const total = v.n * (1 + v.extra / 100)
    const mm = v.rxnVol / Number(v.mmX)
    const primer = (v.primerFinal / v.primerStock) * v.rxnVol
    const nfw = v.rxnVol - mm - 2 * primer - v.template
    const rows = [
      { name: `${v.mmX}× Master Mix`, perRxn: mm },
      { name: `Fwd Primer (${fmt(v.primerStock)} µM)`, perRxn: primer },
      { name: `Rev Primer (${fmt(v.primerStock)} µM)`, perRxn: primer },
      { name: 'Nuclease-Free Water', perRxn: nfw },
    ]
    mix = { total, rows, aliquot: v.rxnVol - v.template, nfw }
  }

  const field = (key, label) => <NumField label={label} value={s[key]} onChange={(x) => set({ [key]: x })} />
  const text = mix && tsv([
    ['Component', 'Per rxn (µL)', `×${fmt(mix.total, 3)} (µL)`],
    ...mix.rows.map((r) => [r.name, fmtVol(r.perRxn), fmtVol(r.perRxn * mix.total)]),
    ['Master mix total', fmtVol(mix.aliquot), fmtVol(mix.aliquot * mix.total)],
    ['Template DNA (per tube)', fmtVol(v.template), ''],
  ])

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        {field('n', '# Reactions')}
        {field('extra', 'Extra %')}
        {field('rxnVol', 'Rxn Vol (µL)')}
        <SelectField label="Master Mix" value={s.mmX} onChange={(mmX) => set({ mmX })}
          options={[{ value: '2', label: '2×' }, { value: '4', label: '4×' }, { value: '5', label: '5×' }]} />
        {field('primerStock', 'Primer Stock (µM)')}
        {field('primerFinal', 'Primer Final (µM)')}
        {field('template', 'Template (µL)')}
      </div>

      {error && <Msg kind="error">{error}</Msg>}
      {mix && mix.nfw < 0 && (
        <Msg kind="error">Water would be negative: the components exceed the reaction volume. Lower the template or primer final concentration, or raise the reaction volume.</Msg>
      )}
      {mix && mix.nfw >= 0 && (
        <div style={{ marginTop: 16, overflowX: 'auto' }}>
          <table className="table">
            <thead><tr><th>Master Mix</th><th><Units>Per rxn (µL)</Units></th><th>×{fmt(mix.total, 3)} <Units>(µL)</Units></th></tr></thead>
            <tbody>
              {mix.rows.map((c) => (
                <tr key={c.name}><td>{c.name}</td><td>{fmtVol(c.perRxn)}</td><td className="highlight">{fmtVol(c.perRxn * mix.total)}</td></tr>
              ))}
              <tr><td className="total">Total</td><td className="total">{fmtVol(mix.aliquot)}</td><td className="total">{fmtVol(mix.aliquot * mix.total)}</td></tr>
            </tbody>
          </table>
          <ol className="steps">
            <li>Combine the components above into one master mix.</li>
            <li>Pipette <strong>{fmtVol(mix.aliquot)} µL</strong> master mix into each of {v.n} tubes.</li>
            <li>Add <strong>{fmtVol(v.template)} µL</strong> template DNA to each tube.</li>
          </ol>
          {v.template > 0 && v.template < MIN_PIPETTE_UL && (
            <Msg kind="warn">Below {MIN_PIPETTE_UL} µL, pipetting is inaccurate. Dilute the template and add a larger volume instead.</Msg>
          )}
          <Toolbar><CopyButton text={text} /><ClearButton onClick={reset} label="Reset" /></Toolbar>
        </div>
      )}
      {(!mix || mix.nfw < 0) && <Toolbar><ClearButton onClick={reset} label="Reset" /></Toolbar>}
    </div>
  )
}
