import { useState } from 'react'
import { Field, fmt } from '../shared'

export default function Molarity() {
  const [mass, setMass] = useState('')
  const [mw, setMw] = useState('')
  const [vol, setVol] = useState('')
  const [volUnit, setVolUnit] = useState('mL')
  const volFactor = { 'µL': 1e-6, mL: 1e-3, L: 1 }

  const m = parseFloat(mass), w = parseFloat(mw), v = parseFloat(vol) * volFactor[volUnit]
  const r = !isNaN(m) && !isNaN(w) && !isNaN(v) && v > 0 && w > 0 ? (m / 1000 / w) / v : null

  return (
    <div>
      <Field label="Mass (mg)">
        <input className="input" type="number" value={mass} onChange={e => setMass(e.target.value)} placeholder="e.g. 100" />
      </Field>
      <Field label="Molecular Weight (g/mol)">
        <input className="input" type="number" value={mw} onChange={e => setMw(e.target.value)} placeholder="e.g. 342.3" />
      </Field>
      <Field label="Volume">
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" style={{ flex: 1 }} type="number" value={vol} onChange={e => setVol(e.target.value)} placeholder="e.g. 10" />
          <select className="select" style={{ width: 80 }} value={volUnit} onChange={e => setVolUnit(e.target.value)}>
            <option>µL</option><option>mL</option><option>L</option>
          </select>
        </div>
      </Field>
      {r !== null && (
        <div className="result-box">
          <div className="result-label">CONCENTRATION</div>
          <div className="result-value">{fmt(r)} M</div>
          <div className="result-sub">= {fmt(r * 1e3)} mM | {fmt(r * 1e6)} µM | {fmt(r * 1e9)} nM</div>
        </div>
      )}
    </div>
  )
}
