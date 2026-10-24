import { NumField, Msg, Toolbar, ClearButton, usePersist, readInputs, fmt } from '../shared'
import { MASS, VOLUME, MOLAR, toBase, fromBase, inOtherUnits } from '../units'

const KEYS = ['mass', 'mw', 'vol', 'conc']
const INITIAL = { mass: '', mw: '', vol: '', conc: '', massUnit: 'mg', volUnit: 'mL', concUnit: 'mM' }
const LABEL = { mass: 'Mass', mw: 'Molecular Weight', vol: 'Volume', conc: 'Concentration' }

// base units: g, g/mol, L, mol/L; moles = mass / mw = conc * vol
function solve(missing, v) {
  switch (missing) {
    case 'conc': return v.mass / v.mw / v.vol
    case 'mass': return v.conc * v.vol * v.mw
    case 'vol': return v.mass / v.mw / v.conc
    case 'mw': return v.mass / (v.conc * v.vol)
  }
}

export default function Molarity() {
  const [s, set, reset] = usePersist('molarity', INITIAL)
  const input = readInputs(s, KEYS, 3)

  let result = null
  if (input.status === 'solve') {
    const [missing] = input.missing
    const v = input.values
    const base = solve(missing, {
      mass: v.mass === null ? null : toBase(v.mass, MASS, s.massUnit),
      mw: v.mw,
      vol: v.vol === null ? null : toBase(v.vol, VOLUME, s.volUnit),
      conc: v.conc === null ? null : toBase(v.conc, MOLAR, s.concUnit),
    })
    const shown = {
      mass: { table: MASS, unit: s.massUnit },
      vol: { table: VOLUME, unit: s.volUnit },
      conc: { table: MOLAR, unit: s.concUnit },
      mw: { table: null, unit: 'g/mol' },
    }[missing]
    result = {
      missing,
      value: shown.table ? fromBase(base, shown.table, shown.unit) : base,
      unit: shown.unit,
      others: shown.table ? inOtherUnits(base, shown.table, shown.unit) : [],
    }
  }

  const placeholder = (k) => (result?.missing === k ? `= ${fmt(result.value)}` : '')

  return (
    <div>
      <NumField label="Mass" value={s.mass} onChange={(mass) => set({ mass })}
        units={Object.keys(MASS)} unit={s.massUnit} onUnit={(massUnit) => set({ massUnit })} placeholder={placeholder('mass')} />
      <NumField label="Molecular Weight (g/mol)" value={s.mw} onChange={(mw) => set({ mw })} placeholder={placeholder('mw')} />
      <NumField label="Volume" value={s.vol} onChange={(vol) => set({ vol })}
        units={Object.keys(VOLUME)} unit={s.volUnit} onUnit={(volUnit) => set({ volUnit })} placeholder={placeholder('vol')} />
      <NumField label="Concentration" value={s.conc} onChange={(conc) => set({ conc })}
        units={Object.keys(MOLAR)} unit={s.concUnit} onUnit={(concUnit) => set({ concUnit })} placeholder={placeholder('conc')} />

      {input.status === 'hint' && <Msg>Fill in any three fields; the fourth is calculated.</Msg>}
      {input.status === 'full' && <Msg>All four fields are filled. Clear the one you want to calculate.</Msg>}
      {input.status === 'error' && <Msg kind="error">{input.message}</Msg>}
      {result && (
        <div className="result-box">
          <div className="result-label">{LABEL[result.missing].toUpperCase()}</div>
          <div className="result-value">{fmt(result.value)} {result.unit}</div>
          {result.others.length > 0 && (
            <div className="result-sub">= {result.others.map((o) => `${fmt(o.value)} ${o.unit}`).join(' | ')}</div>
          )}
          <div className="result-note">moles = mass ÷ MW = concentration × volume</div>
        </div>
      )}
      <Toolbar><ClearButton onClick={reset} /></Toolbar>
    </div>
  )
}
