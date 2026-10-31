import { NumField, SegField, Msg, Result, SolveHint, Toolbar, ClearButton, ShareButton, TextField, usePersist, parseNum, readInputs, fmt, fmtInt, calcPlaceholder } from '../shared'
import { MOLAR, MASS_CONC, toBase, fromBase, inOtherUnits } from '../units'
import { NUCLEIC } from '../data'

const PROTEIN_DA_PER_AA = 110
const CELLS_PER_OD = 8e8
const OD_LINEAR_MAX = 1
const RCF_K = 1.118e-5 // RCF = K · r(cm) · RPM²

const INITIAL = {
  mode: 'conc',
  mw: '', mass: '', massUnit: 'µg/mL', molar: '', molarUnit: 'nM',
  molecule: 'dsDNA', length: '', kda: '',
  od: '', cells: '',
  radius: '', rpm: '', rcf: '', rotorName: '', rotors: [],
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
        placeholder={calcPlaceholder(res?.missing === 'mass', res?.value)} hint="1 µg/mL = 1 ng/µL" />
      <NumField label="Molar Concentration" value={s.molar} onChange={(v) => set({ molar: v })}
        units={Object.keys(MOLAR)} unit={s.molarUnit} onUnit={(u) => set({ molarUnit: u })}
        placeholder={calcPlaceholder(res?.missing === 'molar', res?.value)} />
      {mw === null && <Msg>Enter the molecular weight first.</Msg>}
      {mw !== null && !(mw > 0) && <Msg kind="error">Molecular weight must be a number greater than zero.</Msg>}
      {mw > 0 && <SolveHint input={conc} need={1} total={2} />}
      {res && (
        <Result>
          <div className="result-value">{fmt(res.value)} {res.unit}</div>
          {res.others.length > 0 && <div className="result-sub">= {res.others.map((o) => `${fmt(o.value)} ${o.unit}`).join(' | ')}</div>}
        </Result>
      )}
    </>
  )
}

const SIZE = {
  ...NUCLEIC,
  Protein: { unit: 'aa', mw: (n) => n * PROTEIN_DA_PER_AA, length: (mw) => mw / PROTEIN_DA_PER_AA },
}

function Size({ s, set }) {
  const m = SIZE[s.molecule]
  const size = readInputs(s, ['length', 'kda'], 1)
  let res = null
  if (size.status === 'solve') {
    res = size.values.length !== null
      ? { missing: 'kda', length: size.values.length, kda: m.mw(size.values.length) / 1000 }
      : { missing: 'length', kda: size.values.kda, length: m.length(size.values.kda * 1000) }
  }
  const tooSmall = res?.missing === 'length' && res.length < 1
  return (
    <>
      <SegField label="Molecule" value={s.molecule} options={Object.keys(SIZE)} onChange={(v) => set({ molecule: v })} />
      <NumField label={`Length (${m.unit})`} value={s.length} onChange={(v) => set({ length: v })}
        placeholder={calcPlaceholder(res?.missing === 'length', res?.length)} />
      <NumField label="Molecular Weight (kDa)" value={s.kda} onChange={(v) => set({ kda: v })}
        placeholder={calcPlaceholder(res?.missing === 'kda', res?.kda)} />
      <SolveHint input={size} need={1} total={2} />
      {tooSmall && <Msg kind="error">That molecular weight is smaller than one {m.unit}.</Msg>}
      {res && !tooSmall && (
        <Result>
          {fmt(res.length)} {m.unit} ≈ {fmt(res.kda)} kDa = {fmt(res.kda / 1000)} MDa
          <div className="result-note">
            {s.molecule === 'Protein' ? `Average ${PROTEIN_DA_PER_AA} Da per amino acid` : 'NEB formula for an average sequence'}
          </div>
        </Result>
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
        placeholder={calcPlaceholder(res?.missing === 'od', res?.od)} />
      <NumField label="Cells/mL" value={s.cells} onChange={(v) => set({ cells: v })}
        placeholder={calcPlaceholder(res?.missing === 'cells', res?.cells)} />
      <SolveHint input={cells} need={1} total={2} />
      {res && (
        <Result>
          OD₆₀₀ {fmt(res.od)} ≈ {fmt(res.cells)} cells/mL
          <div className="result-note"><i>E. coli</i> approximation: 1 OD ≈ 8 × 10⁸ cells/mL. Calibrate for other strains and spectrophotometers.</div>
        </Result>
      )}
      {res && res.od > OD_LINEAR_MAX && (
        <Msg kind="warn">Above OD {OD_LINEAR_MAX}, readings are no longer linear. Dilute the culture, measure again, and multiply by the dilution.</Msg>
      )}
    </>
  )
}

function Speed({ s, set }) {
  const speed = readInputs(s, ['radius', 'rpm', 'rcf'], 2)
  let res = null
  if (speed.status === 'solve') {
    const { radius, rpm, rcf } = speed.values
    const [missing] = speed.missing
    if (missing === 'rcf') res = { missing, radius, rpm, rcf: RCF_K * radius * rpm * rpm }
    if (missing === 'rpm') res = { missing, radius, rcf, rpm: Math.sqrt(rcf / (RCF_K * radius)) }
    if (missing === 'radius') res = { missing, rpm, rcf, radius: rcf / (RCF_K * rpm * rpm) }
  }
  const r = parseNum(s.radius)
  const canSave = r > 0 && s.rotorName.trim() !== ''
  const save = () => {
    const name = s.rotorName.trim()
    set({ rotors: [...s.rotors.filter((x) => x.name !== name), { name, radius: s.radius }], rotorName: '' })
  }
  const formatRadius = (x) => fmt(x, 3)

  return (
    <>
      <NumField label="Rotor Radius (cm)" value={s.radius} onChange={(v) => set({ radius: v })}
        placeholder={calcPlaceholder(res?.missing === 'radius', res?.radius, formatRadius)}
        hint="Use the maximum radius (rmax) from the rotor manual or the rotor itself." />
      {s.rotors.length > 0 && (
        <div className="chips" role="group" aria-label="Saved rotors">
          {s.rotors.map((x) => (
            <span key={x.name} className="chip-pair">
              <button type="button" className="chip" onClick={() => set({ radius: x.radius })}>{x.name} · {x.radius} cm</button>
              <button type="button" className="chip chip-x" aria-label={`Remove ${x.name}`}
                onClick={() => set({ rotors: s.rotors.filter((y) => y.name !== x.name) })}>×</button>
            </span>
          ))}
        </div>
      )}
      {r > 0 && (
        <div className="row save-row">
          <TextField label="Save Rotor As" value={s.rotorName} onChange={(v) => set({ rotorName: v })} placeholder="e.g. Eppendorf 5424" />
          <button type="button" className="btn" disabled={!canSave} onClick={save}>Save</button>
        </div>
      )}
      <NumField label="RPM" value={s.rpm} onChange={(v) => set({ rpm: v })}
        placeholder={calcPlaceholder(res?.missing === 'rpm', res?.rpm, fmtInt)} />
      <NumField label="RCF (×g)" value={s.rcf} onChange={(v) => set({ rcf: v })}
        placeholder={calcPlaceholder(res?.missing === 'rcf', res?.rcf, fmtInt)} />
      <SolveHint input={speed} need={2} total={3} />
      {res && (
        <Result>
          <div className="result-value" style={{ fontSize: 18 }}>
            {fmtInt(res.rpm)} RPM ⟷ {fmtInt(res.rcf)} ×g
          </div>
          <div className="result-sub">Rotor radius {formatRadius(res.radius)} cm</div>
          <div className="result-note">RCF = 1.118 × 10⁻⁵ × r × RPM²</div>
        </Result>
      )}
    </>
  )
}

const MODES = {
  conc: { label: 'Mass ↔ Molar', Panel: MassMolar, keys: ['mw', 'mass', 'molar'] },
  size: { label: 'Length ↔ MW', Panel: Size, keys: ['length', 'kda'] },
  od: { label: 'OD₆₀₀ ↔ Cells', Panel: Cells, keys: ['od', 'cells'] },
  rcf: { label: 'RPM ↔ RCF', Panel: Speed, keys: ['radius', 'rpm', 'rcf'] },
}

const CHOICES = { mode: Object.keys(MODES), molecule: Object.keys(SIZE), massUnit: Object.keys(MASS_CONC), molarUnit: Object.keys(MOLAR) }

export default function UnitConverter() {
  const [s, set] = usePersist('units', INITIAL, CHOICES)
  const { Panel, keys } = MODES[s.mode] ?? MODES.conc
  const clear = () => set(Object.fromEntries(keys.map((k) => [k, ''])))
  return (
    <div>
      <SegField label="Conversion" value={s.mode} onChange={(mode) => set({ mode })}
        options={Object.entries(MODES).map(([value, m]) => ({ value, label: m.label }))} />
      <Panel s={s} set={set} />
      <Toolbar><ShareButton toolKey="units" state={s} /><ClearButton onClick={clear} /></Toolbar>
    </div>
  )
}
