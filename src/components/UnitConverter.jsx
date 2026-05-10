import { useState } from 'react'
import { Field, fmt } from '../shared'

export default function UnitConverter() {
  const [mode, setMode] = useState('conc')
  const [val, setVal] = useState('')
  const [mw, setMw] = useState('')
  const v = parseFloat(val), w = parseFloat(mw)

  return (
    <div>
      <Field label="Conversion">
        <select className="select" value={mode} onChange={e => setMode(e.target.value)}>
          <option value="conc">μg/mL → nM (needs MW)</option>
          <option value="bp">bp → kDa (dsDNA)</option>
          <option value="od">OD₆₀₀ → cells/mL</option>
        </select>
      </Field>
      <Field label={mode === 'conc' ? 'Concentration (μg/mL)' : mode === 'bp' ? 'Length (bp)' : 'OD₆₀₀'}>
        <input className="input" type="number" value={val} onChange={e => setVal(e.target.value)} />
      </Field>
      {mode === 'conc' && <Field label="Molecular Weight (g/mol)"><input className="input" type="number" value={mw} onChange={e => setMw(e.target.value)} /></Field>}
      {mode === 'conc' && !isNaN(v) && !isNaN(w) && w > 0 && (
        <div className="result-box">{fmt(v)} μg/mL = {fmt((v / w) * 1e6)} nM = {fmt((v / w) * 1e3)} μM = {fmt(v / w)} mM</div>
      )}
      {mode === 'bp' && !isNaN(v) && (
        <div className="result-box">{fmt(v)} bp = {fmt((v * 660) / 1000)} kDa = {fmt((v * 660) / 1e6)} MDa</div>
      )}
      {mode === 'od' && !isNaN(v) && (
        <div className="result-box">
          OD₆₀₀ {fmt(v)} ≈ {fmt(v * 8e8)} cells/mL
          <div className="result-note">Using E. coli approximation (1 OD ≈ 8×10⁸ cells/mL)</div>
        </div>
      )}
    </div>
  )
}
