import { NumField, SelectField, Msg, Toolbar, ClearButton, usePersist, parseNum, readInputs, fmt, fmtInt } from '../shared'
import { MOLAR, MASS_CONC, toBase, fromBase, inOtherUnits } from '../units'

const MOLECULES = {
  dsDNA: { per: 660, unit: 'bp' },
  ssDNA: { per: 330, unit: 'nt' },
  RNA: { per: 340, unit: 'nt' },
  Protein: { per: 110, unit: 'aa' },
}
const CELLS_PER_OD = 8e8
const OD_LINEAR_MAX = 1
const RCF_K = 1.118e-5 // RCF = K · r(cm) · RPM²

const INITIAL = {
  mode: 'conc',
  mw: '', mass: '', massUnit: 'µg/mL', molar: '', molarUnit: 'nM',
  molecule: 'dsDNA', length: '', kda: '',
  od: '', cells: '',
  radius: '', rpm: '', rcf: '',
}

const Hint = ({ status, message, a, b }) => {
  if (status === 'hint') return <Msg>Fill in {a} or {b}; the other is calculated.</Msg>
  if (status === 'full') return <Msg>Both fields are filled. Clear the one you want to calculate.</Msg>
  if (status === 'error') return <Msg kind="error">{message}</Msg>
  return null
}

function MassMolar({ s, set }) {
  const mw = parseNum(s.mw)
  const conc = readInputs(s, ['mass', 'molar'], 1)
  let res = null
  if (mw > 0 && conc.status === 'solve') {
    // g/L ÷ g/mol = mol/L
    if (conc.values.mass !== null) {
      const base = toBase(conc.values.mass, MASS_CONC, s.massUnit) / mw
      res = { missing: 'molar', value: fromBase(base, MOLAR, s.molarUnit), unit: s.molarUnit, others: inOtherUnits(base, MOLAR, s.molarUnit) }
    } else {
      const base = toBase(conc.values.molar, MOLAR, s.molarUnit) * mw
      res = { missing: 'mass', value: fromBase(base, MASS_CONC, s.massUnit), unit: s.massUnit, others: inOtherUnits(base, MASS_CONC, s.massUnit) }
    }
  }
  return (
    <>
      <NumField label="Molecular Weight (g/mol)" value={s.mw} onChange={(v) => set({ mw: v })} />
      <NumField label="Mass Concentration" value={s.mass} onChange={(v) => set({ mass: v })}
        units={Object.keys(MASS_CONC)} unit={s.massUnit} onUnit={(u) => set({ massUnit: u })}
        placeholder={res?.missing === 'mass' ? `= ${fmt(res.value)}` : ''} hint="1 µg/mL = 1 ng/µL" />
      <NumField label="Molar Concentration" value={s.molar} onChange={(v) => set({ molar: v })}
        units={Object.keys(MOLAR)} unit={s.molarUnit} onUnit={(u) => set({ molarUnit: u })}
        placeholder={res?.missing === 'molar' ? `= ${fmt(res.value)}` : ''} />
      {mw === null && <Msg>Enter the molecular weight first.</Msg>}
      {mw !== null && !(mw > 0) && <Msg kind="error">Molecular weight must be a number greater than zero.</Msg>}
      {mw > 0 && <Hint {...conc} a="the mass" b="the molar concentration" />}
      {res && (
        <div className="result-box">
          <div className="result-value">{fmt(res.value)} {res.unit}</div>
          {res.others.length > 0 && <div className="result-sub">= {res.others.map((o) => `${fmt(o.value)} ${o.unit}`).join(' | ')}</div>}
        </div>
      )}
    </>
  )
}

function Size({ s, set }) {
  const m = MOLECULES[s.molecule]
  const size = readInputs(s, ['length', 'kda'], 1)
  let res = null
  if (size.status === 'solve') {
    res = size.values.length !== null
      ? { missing: 'kda', length: size.values.length, kda: (size.values.length * m.per) / 1000 }
      : { missing: 'length', kda: size.values.kda, length: (size.values.kda * 1000) / m.per }
  }
  return (
    <>
      <SelectField label="Molecule" value={s.molecule} onChange={(v) => set({ molecule: v })} options={Object.keys(MOLECULES)} />
      <NumField label={`Length (${m.unit})`} value={s.length} onChange={(v) => set({ length: v })}
        placeholder={res?.missing === 'length' ? `= ${fmt(res.length)}` : ''} />
      <NumField label="Molecular Weight (kDa)" value={s.kda} onChange={(v) => set({ kda: v })}
        placeholder={res?.missing === 'kda' ? `= ${fmt(res.kda)}` : ''} />
      <Hint {...size} a="the length" b="the molecular weight" />
      {res && (
        <div className="result-box">
          {fmt(res.length)} {m.unit} ≈ {fmt(res.kda)} kDa = {fmt(res.kda / 1000)} MDa
          <div className="result-note">Average {m.per} Da per {m.unit}</div>
        </div>
      )}
    </>
  )
}

function Cells({ s, set }) {
  const cells = readInputs(s, ['od', 'cells'], 1)
  let res = null
  if (cells.status === 'solve') {
    res = cells.values.od !== null
      ? { missing: 'cells', od: cells.values.od, cells: cells.values.od * CELLS_PER_OD }
      : { missing: 'od', cells: cells.values.cells, od: cells.values.cells / CELLS_PER_OD }
  }
  return (
    <>
      <NumField label="OD₆₀₀" value={s.od} onChange={(v) => set({ od: v })}
        placeholder={res?.missing === 'od' ? `= ${fmt(res.od)}` : ''} />
      <NumField label="Cells/mL" value={s.cells} onChange={(v) => set({ cells: v })}
        placeholder={res?.missing === 'cells' ? `= ${fmt(res.cells)}` : ''} />
      <Hint {...cells} a="OD₆₀₀" b="cells/mL" />
      {res && (
        <div className="result-box">
          OD₆₀₀ {fmt(res.od)} ≈ {fmt(res.cells)} cells/mL
          <div className="result-note"><i>E. coli</i> approximation: 1 OD ≈ 8 × 10⁸ cells/mL. Calibrate for other strains and spectrophotometers.</div>
        </div>
      )}
      {res && res.od > OD_LINEAR_MAX && (
        <Msg kind="warn">Above OD {OD_LINEAR_MAX}, readings are no longer linear. Dilute the culture, measure again, and multiply by the dilution.</Msg>
      )}
    </>
  )
}

function Speed({ s, set }) {
  const r = parseNum(s.radius)
  const speed = readInputs(s, ['rpm', 'rcf'], 1)
  let res = null
  if (r > 0 && speed.status === 'solve') {
    const { rpm, rcf } = speed.values
    res = rpm !== null
      ? { missing: 'rcf', rpm, rcf: RCF_K * r * rpm * rpm }
      : { missing: 'rpm', rcf, rpm: Math.sqrt(rcf / (RCF_K * r)) }
  }
  return (
    <>
      <NumField label="Rotor Radius (cm)" value={s.radius} onChange={(v) => set({ radius: v })}
        hint="Use the maximum radius (rmax) from the rotor manual or the rotor itself." />
      <NumField label="RPM" value={s.rpm} onChange={(v) => set({ rpm: v })}
        placeholder={res?.missing === 'rpm' ? `= ${fmtInt(res.rpm)}` : ''} />
      <NumField label="RCF (×g)" value={s.rcf} onChange={(v) => set({ rcf: v })}
        placeholder={res?.missing === 'rcf' ? `= ${fmtInt(res.rcf)}` : ''} />
      {r === null && <Msg>Enter the rotor radius first.</Msg>}
      {r !== null && !(r > 0) && <Msg kind="error">Rotor radius must be a number greater than zero.</Msg>}
      {r > 0 && <Hint {...speed} a="RPM" b="RCF" />}
      {res && (
        <div className="result-box">
          {fmtInt(res.rpm)} RPM ⟷ {fmtInt(res.rcf)} ×g
          <div className="result-note">RCF = 1.118 × 10⁻⁵ × r × RPM²</div>
        </div>
      )}
    </>
  )
}

const MODES = {
  conc: { label: 'Mass ↔ Molar Concentration', Panel: MassMolar, keys: ['mw', 'mass', 'molar'] },
  size: { label: 'Length ↔ Molecular Weight', Panel: Size, keys: ['length', 'kda'] },
  od: { label: 'OD₆₀₀ ↔ Cells/mL', Panel: Cells, keys: ['od', 'cells'] },
  rcf: { label: 'RPM ↔ RCF', Panel: Speed, keys: ['radius', 'rpm', 'rcf'] },
}

export default function UnitConverter() {
  const [s, set] = usePersist('units', INITIAL)
  const { Panel, keys } = MODES[s.mode]
  const clear = () => set(Object.fromEntries(keys.map((k) => [k, ''])))
  return (
    <div>
      <SelectField label="Conversion" value={s.mode} onChange={(mode) => set({ mode })}
        options={Object.entries(MODES).map(([value, m]) => ({ value, label: m.label }))} />
      <Panel s={s} set={set} />
      <Toolbar><ClearButton onClick={clear} /></Toolbar>
    </div>
  )
}
