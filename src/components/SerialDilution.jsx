import { Units, NumField, Msg, Toolbar, CopyButton, ClearButton, usePersist, parseNum, fmt, fmtVol, tsv, MIN_PIPETTE_UL } from '../shared'

const CONC_UNITS = ['M', 'mM', 'µM', 'nM', 'mg/mL', 'µg/mL', 'ng/µL', 'cells/mL', '%']
const INITIAL = { stock: '100', stockUnit: 'µM', factor: '10', steps: '5', volume: '100' }
const MAX_STEPS = 30

function check(s) {
  const v = { stock: parseNum(s.stock), factor: parseNum(s.factor), steps: parseNum(s.steps), volume: parseNum(s.volume) }
  if (Object.values(v).some((x) => x === null)) return { error: 'Fill in all fields.' }
  if (Object.values(v).some((x) => Number.isNaN(x))) return { error: 'Enter numbers only.' }
  if (v.stock <= 0 || v.volume <= 0) return { error: 'Stock concentration and volume must be greater than zero.' }
  if (v.factor <= 1) return { error: 'Dilution factor must be greater than 1.' }
  if (!Number.isInteger(v.steps) || v.steps < 1 || v.steps > MAX_STEPS) return { error: `Number of steps must be a whole number from 1 to ${MAX_STEPS}.` }
  return { v }
}

export default function SerialDilution() {
  const [s, set, reset] = usePersist('serial', INITIAL)
  const { v, error } = check(s)

  let plan = null
  if (v) {
    // diluent D and transfer T with T / (T + D) = 1 / factor; every tube keeps D after passing T on
    const diluent = v.volume
    const transfer = v.volume / (v.factor - 1)
    const tubes = Array.from({ length: v.steps }, (_, i) => ({
      tube: i + 1,
      conc: v.stock / v.factor ** (i + 1),
      from: i === 0 ? 'stock' : `tube ${i}`,
    }))
    plan = { diluent, transfer, tubes }
  }

  const text = plan && tsv([
    ['Tube', `Conc. (${s.stockUnit})`, 'Diluent (µL)', 'Transfer (µL)', 'From'],
    ...plan.tubes.map((t) => [t.tube, fmt(t.conc), fmtVol(plan.diluent), fmtVol(plan.transfer), t.from]),
  ])

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        <NumField label="Stock Conc." value={s.stock} onChange={(stock) => set({ stock })}
          units={CONC_UNITS} unit={s.stockUnit} onUnit={(stockUnit) => set({ stockUnit })} />
        <NumField label="Dilution Factor" value={s.factor} onChange={(factor) => set({ factor })} />
        <NumField label="# Steps" value={s.steps} onChange={(steps) => set({ steps })} />
        <NumField label="Final Vol per Tube (µL)" value={s.volume} onChange={(volume) => set({ volume })} />
      </div>

      {error && <Msg kind="error">{error}</Msg>}
      {plan && (
        <div style={{ marginTop: 16, overflowX: 'auto' }}>
          <table className="table">
            <thead><tr><th>Tube</th><th>Conc. <Units>{`(${s.stockUnit})`}</Units></th><th><Units>Diluent (µL)</Units></th><th><Units>Transfer (µL)</Units></th></tr></thead>
            <tbody>{plan.tubes.map((t) => (
              <tr key={t.tube}>
                <td>{t.tube}</td>
                <td className="highlight">{fmt(t.conc)}</td>
                <td>{fmtVol(plan.diluent)}</td>
                <td>{fmtVol(plan.transfer)} <span style={{ color: 'var(--text-muted)' }}>from {t.from}</span></td>
              </tr>
            ))}</tbody>
          </table>
          <ol className="steps">
            <li>Put <strong>{fmtVol(plan.diluent)} µL</strong> diluent in {v.steps > 1 ? `each of ${v.steps} tubes` : 'the tube'}.</li>
            <li>
              Transfer <strong>{fmtVol(plan.transfer)} µL</strong> stock into {v.steps > 1 ? 'tube 1 and mix; continue down the series' : 'the tube and mix'}.
            </li>
            <li>
              {v.steps > 1 ? `Tubes 1–${v.steps - 1} end with ${fmtVol(plan.diluent)} µL; the final tube contains ` : 'The tube contains '}
              <strong>{fmtVol(plan.diluent + plan.transfer)} µL</strong>.
            </li>
          </ol>
          {plan.transfer < MIN_PIPETTE_UL && (
            <Msg kind="warn">The transfer volume is below {MIN_PIPETTE_UL} µL, where pipetting is inaccurate. Raise the final volume or lower the dilution factor.</Msg>
          )}
          <Toolbar><CopyButton text={text} /><ClearButton onClick={reset} label="Reset" /></Toolbar>
        </div>
      )}
      {!plan && <Toolbar><ClearButton onClick={reset} label="Reset" /></Toolbar>}
    </div>
  )
}
