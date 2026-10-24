import { NumField, Msg, Toolbar, ClearButton, usePersist, parseNum, readInputs, fmtInt } from '../shared'

const INITIAL = { radius: '', rpm: '', rcf: '' }
const K = 1.118e-5 // RCF = K · r(cm) · RPM²

export default function Centrifuge() {
  const [s, set, reset] = usePersist('centrifuge', INITIAL)
  const r = parseNum(s.radius)
  const speed = readInputs(s, ['rpm', 'rcf'], 1)

  let message = null
  let res = null
  if (r === null) message = { kind: 'hint', text: 'Enter the rotor radius first.' }
  else if (Number.isNaN(r) || r <= 0) message = { kind: 'error', text: 'Rotor radius must be a number greater than zero.' }
  else if (speed.status === 'hint') message = { kind: 'hint', text: 'Fill in RPM or RCF; the other is calculated.' }
  else if (speed.status === 'full') message = { kind: 'hint', text: 'Both speeds are filled. Clear the one you want to calculate.' }
  else if (speed.status === 'error') message = { kind: 'error', text: speed.message }
  else {
    const { rpm, rcf } = speed.values
    res = rpm !== null ? { missing: 'rcf', rpm, rcf: K * r * rpm * rpm } : { missing: 'rpm', rcf, rpm: Math.sqrt(rcf / (K * r)) }
  }

  return (
    <div>
      <NumField label="Rotor Radius (cm)" value={s.radius} onChange={(radius) => set({ radius })}
        hint="Use the maximum radius (rmax) from the rotor manual or the rotor itself." />
      <NumField label="RPM" value={s.rpm} onChange={(rpm) => set({ rpm })}
        placeholder={res?.missing === 'rpm' ? `= ${fmtInt(res.rpm)}` : ''} />
      <NumField label="RCF (×g)" value={s.rcf} onChange={(rcf) => set({ rcf })}
        placeholder={res?.missing === 'rcf' ? `= ${fmtInt(res.rcf)}` : ''} />

      {message && <Msg kind={message.kind}>{message.text}</Msg>}
      {res && (
        <div className="result-box" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <span className="result-value" style={{ fontSize: 18 }}>{fmtInt(res.rpm)} RPM</span>
          <span style={{ color: 'var(--accent-text)' }} aria-hidden="true">⟷</span>
          <span className="result-value" style={{ fontSize: 18 }}>{fmtInt(res.rcf)} ×g</span>
          <div className="result-note" style={{ width: '100%' }}>RCF = 1.118 × 10⁻⁵ × r × RPM²</div>
        </div>
      )}
      <Toolbar><ClearButton onClick={reset} /></Toolbar>
    </div>
  )
}
