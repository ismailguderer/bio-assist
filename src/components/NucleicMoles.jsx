import { NumField, SegField, Msg, Result, SolveHint, Toolbar, ClearButton, ShareButton, usePersist, parseNum, readInputs, fmt, calcPlaceholder } from '../shared'
import { DNA_MASS, MOLES, toBase, fromBase } from '../units'
import { NUCLEIC, AVOGADRO } from '../data'

const INITIAL = { molecule: 'dsDNA', length: '', mass: '', massUnit: 'ng', moles: '', molesUnit: 'pmol', copies: '' }
const CHOICES = { molecule: Object.keys(NUCLEIC), massUnit: Object.keys(DNA_MASS), molesUnit: Object.keys(MOLES) }

export default function NucleicMoles() {
  const [s, set, reset] = usePersist('nucleic', INITIAL, CHOICES)
  const m = NUCLEIC[s.molecule]
  const length = parseNum(s.length)
  const amount = readInputs(s, ['mass', 'moles', 'copies'], 1)

  let res = null
  if (length > 0 && amount.status === 'solve') {
    const mw = m.mw(length)
    const v = amount.values
    // base: g and mol; moles = mass ÷ MW, copies = moles × Avogadro
    const mol = v.mass !== null ? toBase(v.mass, DNA_MASS, s.massUnit) / mw
      : v.moles !== null ? toBase(v.moles, MOLES, s.molesUnit)
      : v.copies / AVOGADRO
    res = {
      missing: amount.missing,
      mw,
      mass: fromBase(mol * mw, DNA_MASS, s.massUnit),
      moles: fromBase(mol, MOLES, s.molesUnit),
      copies: mol * AVOGADRO,
    }
  }
  const ph = (k) => calcPlaceholder(res?.missing.includes(k), res?.[k])

  return (
    <div>
      <SegField label="Molecule" value={s.molecule} options={Object.keys(NUCLEIC)} onChange={(molecule) => set({ molecule })} />
      <NumField label={`Length (${m.unit})`} value={s.length} onChange={(v) => set({ length: v })} />
      <NumField label="Mass" value={s.mass} onChange={(v) => set({ mass: v })}
        units={Object.keys(DNA_MASS)} unit={s.massUnit} onUnit={(massUnit) => set({ massUnit })} placeholder={ph('mass')} />
      <NumField label="Moles" value={s.moles} onChange={(v) => set({ moles: v })}
        units={Object.keys(MOLES)} unit={s.molesUnit} onUnit={(molesUnit) => set({ molesUnit })} placeholder={ph('moles')} />
      <NumField label="Copies" value={s.copies} onChange={(v) => set({ copies: v })} placeholder={ph('copies')}
        hint="Enter a concentration (ng/µL) as mass to get pmol/µL and copies/µL." />

      {length === null && <Msg>Enter the length first.</Msg>}
      {length !== null && !(length > 0) && <Msg kind="error">Length must be a number greater than zero.</Msg>}
      {length > 0 && <SolveHint input={amount} need={1} total={3} />}
      {res && (
        <Result>
          <div className="result-value" style={{ fontSize: 18 }}>
            {fmt(res.mass)} {s.massUnit} = {fmt(res.moles)} {s.molesUnit} = {fmt(res.copies, 3)} copies
          </div>
          <div className="result-note">MW {fmt(res.mw / 1000)} kDa (NEB formula for {s.molecule})</div>
        </Result>
      )}
      <Toolbar><ShareButton toolKey="nucleic" state={s} /><ClearButton onClick={reset} /></Toolbar>
    </div>
  )
}
