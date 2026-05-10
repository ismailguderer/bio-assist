import { useState } from 'react'
import { Field, fmt } from '../shared'

export default function Centrifuge() {
  const [mode, setMode] = useState('rpm2rcf')
  const [rpm, setRpm] = useState('')
  const [rcf, setRcf] = useState('')
  const [radius, setRadius] = useState('10')

  const r = parseFloat(radius)
  const calc = () => {
    if (isNaN(r) || r <= 0) return null
    if (mode === 'rpm2rcf') {
      const rp = parseFloat(rpm)
      return !isNaN(rp) && rp >= 0 ? { rcf: 1.118e-5 * r * rp * rp, rpm: rp } : null
    }
    const rc = parseFloat(rcf)
    return !isNaN(rc) && rc >= 0 ? { rpm: Math.sqrt(rc / (1.118e-5 * r)), rcf: rc } : null
  }
  const res = calc()

  return (
    <div>
      <Field label="Direction">
        <select className="select" value={mode} onChange={e => setMode(e.target.value)}>
          <option value="rpm2rcf">RPM → RCF (×g)</option>
          <option value="rcf2rpm">RCF (×g) → RPM</option>
        </select>
      </Field>
      <Field label="Rotor radius (cm)"><input className="input" type="number" value={radius} onChange={e => setRadius(e.target.value)} /></Field>
      {mode === 'rpm2rcf'
        ? <Field label="RPM"><input className="input" type="number" value={rpm} onChange={e => setRpm(e.target.value)} /></Field>
        : <Field label="RCF (×g)"><input className="input" type="number" value={rcf} onChange={e => setRcf(e.target.value)} /></Field>
      }
      {res && (
        <div className="result-box" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <span className="result-value" style={{ fontSize: 18 }}>{fmt(res.rpm)} RPM</span>
          <span style={{ color: 'var(--accent-text)' }}>⟷</span>
          <span className="result-value" style={{ fontSize: 18 }}>{fmt(res.rcf)} ×g</span>
          <div className="result-note" style={{ width: '100%' }}>RCF = 1.118 × 10⁻⁵ × r × RPM²</div>
        </div>
      )}
    </div>
  )
}
