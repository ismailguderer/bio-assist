import { NumField, Msg, Result, Toolbar, ClearButton, ShareButton, usePersist, parseNum, fmt, fmtVol, MIN_PIPETTE_UL } from '../shared'
import { NUCLEIC } from '../data'

const INITIAL = { vectorBp: '', vectorNg: '50', insertBp: '', ratio: '3', vectorConc: '', insertConc: '' }
const FIELDS = ['vectorBp', 'vectorNg', 'insertBp', 'ratio']

export default function Ligation() {
  const [s, set, reset] = usePersist('ligation', INITIAL)
  const v = Object.fromEntries(Object.keys(INITIAL).map((k) => [k, parseNum(s[k])]))
  const missing = FIELDS.filter((k) => v[k] === null)
  const invalid = Object.entries(v).some(([, x]) => x !== null && !(x > 0))

  let res = null
  if (!missing.length && !invalid) {
    // ng insert = ng vector × (insert bp ÷ vector bp) × molar ratio
    const insertNg = v.vectorNg * (v.insertBp / v.vectorBp) * v.ratio
    const fmol = (ng, bp) => (ng * 1e-9 / NUCLEIC.dsDNA.mw(bp)) * 1e15
    res = {
      insertNg,
      vectorFmol: fmol(v.vectorNg, v.vectorBp),
      insertFmol: fmol(insertNg, v.insertBp),
      vectorUl: v.vectorConc ? v.vectorNg / v.vectorConc : null,
      insertUl: v.insertConc ? insertNg / v.insertConc : null,
    }
  }
  const tiny = res && [res.vectorUl, res.insertUl].some((x) => x !== null && x < MIN_PIPETTE_UL)

  return (
    <div>
      <div className="grid-2">
        <NumField label="Vector Length (bp)" value={s.vectorBp} onChange={(x) => set({ vectorBp: x })} />
        <NumField label="Vector Mass (ng)" value={s.vectorNg} onChange={(x) => set({ vectorNg: x })} presets={[25, 50, 100]} />
        <NumField label="Insert Length (bp)" value={s.insertBp} onChange={(x) => set({ insertBp: x })} />
        <NumField label="Insert:Vector Ratio" value={s.ratio} onChange={(x) => set({ ratio: x })} presets={[1, 3, 5, 7]} presetSuffix=":1" />
        <NumField label="Vector Conc. (ng/µL, optional)" value={s.vectorConc} onChange={(x) => set({ vectorConc: x })} />
        <NumField label="Insert Conc. (ng/µL, optional)" value={s.insertConc} onChange={(x) => set({ insertConc: x })} />
      </div>

      {invalid && <Msg kind="error">All values must be numbers greater than zero.</Msg>}
      {!invalid && missing.length > 0 && <Msg>Fill in both lengths, the vector mass, and the ratio.</Msg>}
      {res && (
        <Result>
          <div className="result-label">INSERT</div>
          <div className="result-value">{fmt(res.insertNg)} ng{res.insertUl !== null && ` = ${fmtVol(res.insertUl)} µL`}</div>
          <div className="result-sub">
            Vector {fmt(v.vectorNg)} ng{res.vectorUl !== null && ` (${fmtVol(res.vectorUl)} µL)`} = {fmt(res.vectorFmol)} fmol · insert {fmt(res.insertFmol)} fmol
          </div>
          <div className="result-note">ng insert = ng vector × (insert bp ÷ vector bp) × ratio</div>
        </Result>
      )}
      {tiny && <Msg kind="warn">Below {MIN_PIPETTE_UL} µL, pipetting is inaccurate. Dilute the DNA first.</Msg>}
      <Toolbar><ShareButton toolKey="ligation" state={s} /><ClearButton onClick={reset} label="Reset" /></Toolbar>
    </div>
  )
}
