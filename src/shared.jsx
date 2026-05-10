export function Field({ label, children }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {children}
    </div>
  )
}

export function fmt(n) {
  if (n === null || n === undefined || isNaN(n) || !isFinite(n)) return '—'
  if (Math.abs(n) >= 1e6) return n.toExponential(3)
  if (Math.abs(n) < 0.001 && n !== 0) return n.toExponential(3)
  return parseFloat(n.toPrecision(6)).toString()
}
