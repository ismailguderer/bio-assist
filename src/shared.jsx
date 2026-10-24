import { useEffect, useId, useState } from 'react'

/** Volumes below this many µL cannot be pipetted accurately. */
export const MIN_PIPETTE_UL = 0.5

/** Parse user input: accepts "0,5" and "0.5"; empty -> null; garbage -> NaN. */
export function parseNum(text) {
  const t = String(text ?? '').trim().replace(',', '.')
  if (t === '') return null
  return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t) ? Number(t) : NaN
}

const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }

/** General number: `sig` significant digits; scientific notation for very large or small values. */
export function fmt(n, sig = 4) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  if (n === 0) return '0'
  const a = Math.abs(n)
  if (a >= 1e6 || a < 1e-3) {
    const [m, e] = n.toExponential(sig - 1).split('e')
    return `${parseFloat(m)} × 10${String(Number(e)).replace(/./g, (c) => SUP[c])}`
  }
  return String(parseFloat(n.toPrecision(sig)))
}

/** Pipetting volume in µL: 0.01 µL steps below 10 µL, 0.1 µL above. */
export function fmtVol(ul) {
  if (!Number.isFinite(ul)) return '—'
  return String(parseFloat(ul.toFixed(Math.abs(ul) < 10 ? 2 : 1)))
}

/** Renders the "(…)" parts of a label without text-transform. */
export function Units({ children }) {
  return String(children).split(/(\([^)]*\))/).map((part, i) =>
    part.startsWith('(') ? <span key={i} className="nocase">{part}</span> : part)
}

/** Whole number with thousands separators. */
export const fmtInt = (n) => (Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : '—')

/** Rows of cells -> tab-separated text. */
export const tsv = (rows) => rows.map((r) => r.join('\t')).join('\n')

/** Object state persisted in localStorage under `ba:<key>`. */
export function usePersist(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(`ba:${key}`)
      return saved ? { ...initial, ...JSON.parse(saved) } : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try { localStorage.setItem(`ba:${key}`, JSON.stringify(state)) } catch {}
  }, [key, state])
  const update = (patch) => setState((s) => ({ ...s, ...patch }))
  const reset = () => setState(initial)
  return [state, update, reset]
}

export function NumField({ label, value, onChange, unit, units, onUnit, placeholder, hint }) {
  const id = useId()
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}><Units>{label}</Units></label>
      <div className="row">
        <input
          id={id}
          className="input"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {units && (
          <select className="select unit" aria-label={`${label} unit`} value={unit} onChange={(e) => onUnit(e.target.value)}>
            {units.map((u) => <option key={u}>{u}</option>)}
          </select>
        )}
      </div>
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  )
}

export function SelectField({ label, value, onChange, options }) {
  const id = useId()
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}><Units>{label}</Units></label>
      <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (typeof o === 'string'
          ? <option key={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </div>
  )
}

/** Hint, warning or error shown where the result would be. kind: hint | warn | error */
export function Msg({ kind = 'hint', children }) {
  return <div className={`msg msg-${kind}`} role={kind === 'error' ? 'alert' : undefined}>{children}</div>
}

export function Toolbar({ children }) {
  return <div className="toolbar">{children}</div>
}

export function ClearButton({ onClick, label = 'Clear' }) {
  return <button type="button" className="btn" onClick={onClick}>{label}</button>
}

export function CopyButton({ text, label = 'Copy Table' }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }
  return <button type="button" className="btn" onClick={copy}>{copied ? 'Copied' : label}</button>
}

/**
 * Shared logic for "fill any N, get the rest" forms.
 * Returns { status: 'hint' | 'error' | 'full' | 'solve', missing, values }.
 */
export function readInputs(raw, keys, need) {
  const values = {}
  for (const k of keys) values[k] = parseNum(raw[k])
  const filled = keys.filter((k) => values[k] !== null)
  if (filled.some((k) => Number.isNaN(values[k]))) return { status: 'error', message: 'Enter numbers only.' }
  if (filled.some((k) => values[k] <= 0)) return { status: 'error', message: 'Values must be greater than zero.' }
  if (filled.length < need) return { status: 'hint', count: filled.length }
  if (filled.length > need) return { status: 'full' }
  return { status: 'solve', missing: keys.filter((k) => values[k] === null), values }
}
