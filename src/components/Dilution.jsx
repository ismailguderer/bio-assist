import { NumField, Msg, Result, SolveHint, Toolbar, ClearButton, ShareButton, usePersist, readInputs, fmt, fmtVol, calcPlaceholder, MIN_PIPETTE_UL } from '../shared'
import { VOLUME, ANY_CONC } from '../units'

const KEYS = ['c1', 'v1', 'c2', 'v2']
const INITIAL = { c1: '', v1: '', c2: '', v2: '', c1Unit: 'mM', v1Unit: 'µL', c2Unit: 'µM', v2Unit: 'mL' }
const LABEL = { c1: 'C₁ Stock Concentration', v1: 'V₁ Stock Volume', c2: 'C₂ Final Concentration', v2: 'V₂ Final Volume' }
const CONC_UNITS = Object.keys(ANY_CONC)
const VOL_UNITS = Object.keys(VOLUME)
const CHOICES = { c1Unit: CONC_UNITS, c2Unit: CONC_UNITS, v1Unit: VOL_UNITS, v2Unit: VOL_UNITS }

const unitKey = (k) => `${k}Unit`
const factor = (k, unit) => (k.startsWith('c') ? ANY_CONC[unit].f : VOLUME[unit])

// C1 · V1 = C2 · V2, all in base units
function solve(missing, b) {
  switch (missing) {
    case 'c1': return (b.c2 * b.v2) / b.v1
    case 'v1': return (b.c2 * b.v2) / b.c1
    case 'c2': return (b.c1 * b.v1) / b.v2
    case 'v2': return (b.c1 * b.v1) / b.c2
  }
}

export default function Dilution() {
  const [s, set, reset] = usePersist('dilution', INITIAL, CHOICES)
  const sameFamily = ANY_CONC[s.c1Unit].family === ANY_CONC[s.c2Unit].family
  const input = readInputs(s, KEYS, 3)

  let r = null
  if (input.status === 'solve' && sameFamily) {
    const [missing] = input.missing
    const b = {}
    for (const k of KEYS) b[k] = input.values[k] === null ? null : input.values[k] * factor(k, s[unitKey(k)])
    b[missing] = solve(missing, b)
    r = {
      missing,
      value: b[missing] / factor(missing, s[unitKey(missing)]),
      unit: s[unitKey(missing)],
      notDilution: b.c2 > b.c1,
      ratio: b.c1 / b.c2,
      v1: b.v1 / VOLUME[s.v1Unit],
      diluent: (b.v2 - b.v1) / VOLUME[s.v2Unit],
      v1ul: b.v1 / 1e-6,
    }
  }

  const field = (k) => (
    <NumField
      key={k}
      label={LABEL[k]}
      value={s[k]}
      onChange={(val) => set({ [k]: val })}
      units={k.startsWith('c') ? CONC_UNITS : VOL_UNITS}
      unit={s[unitKey(k)]}
      onUnit={(u) => set({ [unitKey(k)]: u })}
      placeholder={calcPlaceholder(r?.missing === k, r?.value)}
    />
  )

  return (
    <div>
      {KEYS.map(field)}

      {!sameFamily && (
        <Msg kind="error">C₁ and C₂ need the same kind of unit (molar, mass, %, or ×). To convert between mass and molar, use Unit Converter.</Msg>
      )}
      {sameFamily && <SolveHint input={input} need={3} total={4} />}
      {r && r.notDilution && (
        <Msg kind="error">The final concentration is higher than the stock, so this is not a dilution. Check the values and units.</Msg>
      )}
      {r && !r.notDilution && (
        <>
          <Result>
            <div className="result-label">{LABEL[r.missing].toUpperCase()}</div>
            <div className="result-value">{fmt(r.value)} {r.unit}</div>
            <div className="result-sub">
              Add {fmt(r.v1)} {s.v1Unit} stock to {fmt(r.diluent)} {s.v2Unit} diluent (dilution 1:{fmt(r.ratio)})
            </div>
            <div className="result-note">C₁V₁ = C₂V₂</div>
          </Result>
          {r.v1ul < MIN_PIPETTE_UL && (
            <Msg kind="warn">
              The stock volume is {fmtVol(r.v1ul)} µL. Below {MIN_PIPETTE_UL} µL, pipetting is inaccurate; make an intermediate dilution first.
            </Msg>
          )}
        </>
      )}
      <Toolbar><ShareButton toolKey="dilution" state={s} /><ClearButton onClick={reset} /></Toolbar>
    </div>
  )
}
