import { NumField, SegField, Msg, Result, Toolbar, ClearButton, ShareButton, usePersist, parseNum, fmt, fmtInt, fmtMl } from '../shared'
import { PLATES } from '../data'

const INITIAL = {
  method: 'hemocytometer', live: '', dead: '', squares: '4', dilution: '2', density: '',
  plate: '24-well', wells: '24', perWell: '', wellVol: '0.5', extra: '10',
}
const HEMOCYTOMETER_FACTOR = 1e4 // one large square holds 0.1 µL

function count(s) {
  if (s.method === 'counter') {
    const density = parseNum(s.density)
    if (density === null) return { hint: 'Enter the cell density from the counter.' }
    if (!(density > 0)) return { error: 'Cell density must be greater than zero.' }
    return { density }
  }
  const live = parseNum(s.live)
  const dead = parseNum(s.dead)
  const squares = parseNum(s.squares)
  const dilution = parseNum(s.dilution)
  if (live === null) return { hint: 'Enter the live cells you counted.' }
  if (!(live > 0) || !(squares > 0) || !(dilution >= 1) || (dead !== null && !(dead >= 0))) {
    return { error: 'Counts must be positive, and the dilution factor at least 1.' }
  }
  return {
    density: (live / squares) * dilution * HEMOCYTOMETER_FACTOR,
    viability: dead !== null ? (live / (live + dead)) * 100 : null,
  }
}

export default function CellSeeding() {
  const [s, set, reset] = usePersist('seeding', INITIAL)
  const c = count(s)
  const wells = parseNum(s.wells)
  const perWell = parseNum(s.perWell)
  const wellVol = parseNum(s.wellVol)
  const extra = parseNum(s.extra) ?? 0

  let plan = null
  let planMsg = null
  if (c.density) {
    if (perWell === null) planMsg = { kind: 'hint', text: 'Enter the cells you want per well.' }
    else if (!(perWell > 0) || !(wells >= 1) || !(wellVol > 0) || extra < 0) planMsg = { kind: 'error', text: 'Seeding values must be greater than zero.' }
    else {
      const n = wells * (1 + extra / 100)
      const totalMl = wellVol * n
      const cellsMl = (perWell * n) / c.density
      plan = { n, totalMl, cellsMl, mediumMl: totalMl - cellsMl, totalCells: perWell * n }
    }
  }

  const pickPlate = (plate) => set({ plate, wells: String(PLATES[plate].wells), wellVol: String(PLATES[plate].volume) })

  return (
    <div>
      <h3 className="ba-sub">Count</h3>
      <SegField label="Method" value={s.method} onChange={(method) => set({ method })}
        options={[{ value: 'hemocytometer', label: 'Hemocytometer' }, { value: 'counter', label: 'Cell Counter' }]} />
      {s.method === 'hemocytometer' ? (
        <div className="grid-2">
          <NumField label="Live Cells Counted" value={s.live} onChange={(v) => set({ live: v })} />
          <NumField label="Dead Cells (optional)" value={s.dead} onChange={(v) => set({ dead: v })} />
          <NumField label="Squares Counted" value={s.squares} onChange={(v) => set({ squares: v })} presets={[4, 5]} />
          <NumField label="Dilution Factor" value={s.dilution} onChange={(v) => set({ dilution: v })} presets={[1, 2]}
            hint="2 for a 1:1 mix with trypan blue." />
        </div>
      ) : (
        <NumField label="Cells/mL" value={s.density} onChange={(v) => set({ density: v })} />
      )}
      {c.hint && <Msg>{c.hint}</Msg>}
      {c.error && <Msg kind="error">{c.error}</Msg>}
      {c.density && (
        <Result>
          <div className="result-value" style={{ fontSize: 18 }}>{fmt(c.density, 3)} cells/mL</div>
          {c.viability != null && <div className="result-sub">Viability {fmt(c.viability, 3)}%</div>}
        </Result>
      )}

      <h3 className="ba-sub">Seed</h3>
      <SegField label="Plate" value={s.plate} onChange={pickPlate} options={Object.keys(PLATES)} />
      <div className="grid-2">
        <NumField label="Wells" value={s.wells} onChange={(v) => set({ wells: v })} />
        <NumField label="Volume per Well (mL)" value={s.wellVol} onChange={(v) => set({ wellVol: v })} />
        <NumField label="Cells per Well" value={s.perWell} onChange={(v) => set({ perWell: v })} hint="e.g. 50000 or 5e4" />
        <NumField label="Extra %" value={s.extra} onChange={(v) => set({ extra: v })} presets={[0, 10]} presetSuffix="%" />
      </div>
      {planMsg && <Msg kind={planMsg.kind}>{planMsg.text}</Msg>}
      {plan && plan.mediumMl < 0 && (
        <Msg kind="error">The suspension is too dilute: you would need more suspension than the total volume. Spin the cells down and resuspend in less medium.</Msg>
      )}
      {plan && plan.mediumMl >= 0 && (
        <Result>
          <div className="result-value" style={{ fontSize: 18 }}>{fmtMl(plan.cellsMl)} cells + {fmtMl(plan.mediumMl)} medium</div>
          <div className="result-sub">
            {fmtMl(plan.totalMl)} total for {wells} wells{extra > 0 && ` + ${fmt(extra)}% extra`} ({fmtInt(plan.totalCells)} cells); add {fmtMl(wellVol)} per well
          </div>
        </Result>
      )}
      <Toolbar><ShareButton toolKey="seeding" state={s} /><ClearButton onClick={reset} label="Reset" /></Toolbar>
    </div>
  )
}
