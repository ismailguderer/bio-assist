import { useState } from 'react'
import { Field, fmt } from '../shared'

export default function Dilution() {
  const [c1, setC1] = useState('')
  const [v1, setV1] = useState('')
  const [c2, setC2] = useState('')
  const [v2, setV2] = useState('')
  const [solving, setSolving] = useState('v2')

  const calc = () => {
    const vals = { c1: parseFloat(c1), v1: parseFloat(v1), c2: parseFloat(c2), v2: parseFloat(v2) }
    switch (solving) {
      case 'c1': return isNaN(vals.v1 + vals.c2 + vals.v2) ? null : { ...vals, c1: (vals.c2 * vals.v2) / vals.v1 }
      case 'v1': return isNaN(vals.c1 + vals.c2 + vals.v2) ? null : { ...vals, v1: (vals.c2 * vals.v2) / vals.c1 }
      case 'c2': return isNaN(vals.c1 + vals.v1 + vals.v2) ? null : { ...vals, c2: (vals.c1 * vals.v1) / vals.v2 }
      case 'v2': return isNaN(vals.c1 + vals.v1 + vals.c2) ? null : { ...vals, v2: (vals.c1 * vals.v1) / vals.c2 }
    }
  }
  const r = calc()

  return (
    <div>
      <Field label="Solve for">
        <select className="select" value={solving} onChange={e => setSolving(e.target.value)}>
          <option value="c1">C₁ (Stock conc.)</option>
          <option value="v1">V₁ (Stock vol.)</option>
          <option value="c2">C₂ (Final conc.)</option>
          <option value="v2">V₂ (Final vol.)</option>
        </select>
      </Field>
      {solving !== 'c1' && <Field label="C₁ — Stock concentration"><input className="input" type="number" value={c1} onChange={e => setC1(e.target.value)} /></Field>}
      {solving !== 'v1' && <Field label="V₁ — Stock volume"><input className="input" type="number" value={v1} onChange={e => setV1(e.target.value)} /></Field>}
      {solving !== 'c2' && <Field label="C₂ — Final concentration"><input className="input" type="number" value={c2} onChange={e => setC2(e.target.value)} /></Field>}
      {solving !== 'v2' && <Field label="V₂ — Final volume"><input className="input" type="number" value={v2} onChange={e => setV2(e.target.value)} /></Field>}
      {r !== null && (
        <div className="result-box">
          <div className="result-label">{solving.toUpperCase()}</div>
          <div className="result-value">{fmt(r[solving])}</div>
          <div className="result-sub">C₁V₁ = C₂V₂ → {fmt(r.c1)} × {fmt(r.v1)} = {fmt(r.c2)} × {fmt(r.v2)}</div>
        </div>
      )}
    </div>
  )
}
