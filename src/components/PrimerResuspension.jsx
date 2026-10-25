import { NumField, Msg, Result, Toolbar, ClearButton, ShareButton, usePersist, parseNum, fmt, fmtVol, MIN_PIPETTE_UL } from '../shared'

const INITIAL = { nmol: '', stock: '100', working: '10', workingVol: '100' }

export default function PrimerResuspension() {
  const [s, set, reset] = usePersist('primers', INITIAL)
  const nmol = parseNum(s.nmol)
  const stock = parseNum(s.stock)
  const working = parseNum(s.working)
  const workingVol = parseNum(s.workingVol)

  const stockOk = stock > 0
  // nmol ÷ µM = mL, so µL = nmol × 1000 ÷ µM
  const water = nmol > 0 && stockOk ? (nmol * 1000) / stock : null
  const dilution = stockOk && working > 0 && workingVol > 0 && working < stock
    ? { primer: (working * workingVol) / stock, water: workingVol - (working * workingVol) / stock }
    : null

  return (
    <div>
      <h3 className="ba-sub">Stock</h3>
      <NumField label="Amount on Tube (nmol)" value={s.nmol} onChange={(v) => set({ nmol: v })} />
      <NumField label="Stock Concentration (µM)" value={s.stock} onChange={(v) => set({ stock: v })} presets={[100, 50]} />
      {nmol === null && <Msg>Enter the amount printed on the tube or the synthesis report.</Msg>}
      {(Number.isNaN(nmol) || (nmol !== null && nmol <= 0)) && <Msg kind="error">Amount must be a number greater than zero.</Msg>}
      {(Number.isNaN(stock) || (stock !== null && stock <= 0)) && <Msg kind="error">Stock concentration must be greater than zero.</Msg>}
      {water !== null && (
        <Result>
          <div className="result-label">ADD WATER OR TE</div>
          <div className="result-value">{fmtVol(water)} µL</div>
          <div className="result-note">Spin the tube briefly before opening; vortex and let it dissolve for a few minutes.</div>
        </Result>
      )}

      <h3 className="ba-sub">Working Dilution</h3>
      <NumField label="Working Concentration (µM)" value={s.working} onChange={(v) => set({ working: v })} presets={[10, 5, 1]} />
      <NumField label="Working Volume (µL)" value={s.workingVol} onChange={(v) => set({ workingVol: v })} presets={[50, 100, 200]} />
      {stockOk && working >= stock && <Msg kind="error">The working concentration must be lower than the stock.</Msg>}
      {dilution && (
        <Result>
          <div className="result-value">{fmtVol(dilution.primer)} µL stock + {fmtVol(dilution.water)} µL water</div>
          <div className="result-sub">{fmt(working)} µM in {fmtVol(workingVol)} µL (1:{fmt(stock / working)})</div>
        </Result>
      )}
      {dilution && dilution.primer < MIN_PIPETTE_UL && (
        <Msg kind="warn">Below {MIN_PIPETTE_UL} µL, pipetting is inaccurate. Make a larger working volume.</Msg>
      )}
      <Toolbar><ShareButton toolKey="primers" state={s} /><ClearButton onClick={reset} label="Reset" /></Toolbar>
    </div>
  )
}
