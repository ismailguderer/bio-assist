import { NumField, Msg, Toolbar, ClearButton, usePersist, readInputs, fmt, fmtVol, MIN_PIPETTE_UL } from '../shared'
import { VOLUME, MOLAR, toBase, fromBase } from '../units'

const KEYS = ['c1', 'v1', 'c2', 'v2']
const INITIAL = { c1: '', v1: '', c2: '', v2: '', c1Unit: 'mM', v1Unit: 'µL', c2Unit: 'µM', v2Unit: 'mL' }
const LABEL = { c1: 'C₁ Stock Concentration', v1: 'V₁ Stock Volume', c2: 'C₂ Final Concentration', v2: 'V₂ Final Volume' }
const TABLE = { c1: MOLAR, c2: MOLAR, v1: VOLUME, v2: VOLUME }

const unitKey = (k) => `${k}Unit`

// C1 · V1 = C2 · V2, all in base units (mol/L, L)
function solve(missing, b) {
  switch (missing) {
    case 'c1': return (b.c2 * b.v2) / b.v1
    case 'v1': return (b.c2 * b.v2) / b.c1
    case 'c2': return (b.c1 * b.v1) / b.v2
    case 'v2': return (b.c1 * b.v1) / b.c2
  }
}

export default function Dilution() {
  const [s, set, reset] = usePersist('dilution', INITIAL)
  const input = readInputs(s, KEYS, 3)

  let r = null
  if (input.status === 'solve') {
    const [missing] = input.missing
    const b = {}
    for (const k of KEYS) b[k] = input.values[k] === null ? null : toBase(input.values[k], TABLE[k], s[unitKey(k)])
    b[missing] = solve(missing, b)
    r = {
      missing,
      value: fromBase(b[missing], TABLE[missing], s[unitKey(missing)]),
      unit: s[unitKey(missing)],
      notDilution: b.c2 > b.c1,
      factor: b.c1 / b.c2,
      v1: fromBase(b.v1, VOLUME, s.v1Unit),
      diluent: fromBase(b.v2 - b.v1, VOLUME, s.v2Unit),
      v1ul: b.v1 / 1e-6,
    }
  }

  const field = (k) => (
    <NumField
      key={k}
      label={LABEL[k]}
      value={s[k]}
      onChange={(val) => set({ [k]: val })}
      units={Object.keys(TABLE[k])}
      unit={s[unitKey(k)]}
      onUnit={(u) => set({ [unitKey(k)]: u })}
      placeholder={r?.missing === k ? `= ${fmt(r.value)}` : ''}
    />
  )

  return (
    <div>
      {KEYS.map(field)}

      {input.status === 'hint' && <Msg>Fill in any three fields; the fourth is calculated.</Msg>}
      {input.status === 'full' && <Msg>All four fields are filled. Clear the one you want to calculate.</Msg>}
      {input.status === 'error' && <Msg kind="error">{input.message}</Msg>}
      {r && r.notDilution && (
        <Msg kind="error">The final concentration is higher than the stock, so this is not a dilution. Check the values and units.</Msg>
      )}
      {r && !r.notDilution && (
        <>
          <div className="result-box">
            <div className="result-label">{LABEL[r.missing].toUpperCase()}</div>
            <div className="result-value">{fmt(r.value)} {r.unit}</div>
            <div className="result-sub">
              Add {fmt(r.v1)} {s.v1Unit} stock to {fmt(r.diluent)} {s.v2Unit} diluent (dilution 1:{fmt(r.factor)})
            </div>
            <div className="result-note">C₁V₁ = C₂V₂</div>
          </div>
          {r.v1ul < MIN_PIPETTE_UL && (
            <Msg kind="warn">
              The stock volume is {fmtVol(r.v1ul)} µL. Below {MIN_PIPETTE_UL} µL, pipetting is inaccurate; make an intermediate dilution first.
            </Msg>
          )}
        </>
      )}
      <Toolbar><ClearButton onClick={reset} /></Toolbar>
    </div>
  )
}
