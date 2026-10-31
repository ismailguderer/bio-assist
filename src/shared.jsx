import { createContext, useContext, useEffect, useId, useState } from 'react'

/** Volumes below this many µL cannot be pipetted accurately. */
export const MIN_PIPETTE_UL = 0.5

/** Parse user input: accepts "0,5", "0.5" and "10,000"; empty -> null; garbage -> NaN. */
export function parseNum(text) {
  const raw = String(text ?? '').trim()
  // comma-grouped thousands ("10,000", "1,500.5"); a leading 0 ("0,500") stays a decimal comma
  const t = /^[-+]?[1-9]\d{0,2}(,\d{3})+(\.\d+)?$/.test(raw) ? raw.replace(/,/g, '') : raw.replace(',', '.')
  if (t === '') return null
  return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t) ? Number(t) : NaN
}

/** "2,500" reads as 2500 but could mean 2.5 with a decimal comma. Returns a note, or null. */
export function commaNote(text) {
  const raw = String(text ?? '').trim()
  if (!/^[-+]?[1-9]\d{0,2},\d{3}$/.test(raw)) return null
  const n = raw.replace(',', '')
  return `Read "${raw}" as ${n}. For a decimal, type ${raw.replace(',', '.')}.`
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

/** Volume in mL shown as µL below 1 mL. */
export const fmtMl = (ml) => (ml < 1 ? `${fmtVol(ml * 1000)} µL` : `${fmt(ml)} mL`)

/** Whole number with thousands separators. */
export const fmtInt = (n) => (Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : '—')

/** Rows of cells -> tab-separated text. */
export const tsv = (rows) => rows.map((r) => r.join('\t')).join('\n')

/** Renders the "(…)" parts of a label without text-transform. */
export function Units({ children }) {
  return String(children).split(/(\([^)]*\))/).map((part, i) =>
    part.startsWith('(') ? <span key={i} className="nocase">{part}</span> : part)
}

/** Builds links between tools; ToolHost provides the variant for the current page. */
export const ToolContext = createContext({
  hrefFor: (id, query = '') => `${location.pathname}${query ? `?${query}` : ''}#${id}`,
})
export const useToolLink = () => useContext(ToolContext).hrefFor

/** List fields that travel in share links (the other lists are saved data that stays in the browser). */
const SHARED_LISTS = ['components']

/** Saved data kept when a crashed tool is reset: user-made templates and rotors. */
export const USER_DATA = ['saved', 'rotors']

/** Shareable fields of `state` from a ?tool=<key>&… query. */
function fromQuery(key, initial) {
  try {
    const q = new URLSearchParams(location.search)
    if (q.get('tool') !== key) return null
    const patch = {}
    for (const k of Object.keys(initial)) {
      if (!q.has(k)) continue
      if (typeof initial[k] === 'string') patch[k] = q.get(k)
      else if (SHARED_LISTS.includes(k) && Array.isArray(initial[k])) {
        const list = JSON.parse(q.get(k))
        if (Array.isArray(list)) patch[k] = list
      }
    }
    return patch
  } catch {
    return null
  }
}

/** ToolHost provides a setter for the "opened from a shared link" notice. */
export const LinkNoticeContext = createContext(null)

/**
 * Object state persisted in localStorage under `ba:<key>`.
 * A ?tool=<key>&field=value query overrides saved values, then is removed from the address.
 * Those values stay unsaved until the user keeps them (notice buttons) or edits a field.
 * `choices` maps a field to its allowed values (an array, or a function of the state); anything else
 * from storage or a link falls back to the initial value.
 */
export function usePersist(key, initial, choices = {}) {
  const notify = useContext(LinkNoticeContext)
  const [fromUrl] = useState(() => fromQuery(key, initial))
  const [saved] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`ba:${key}`) || '{}') } catch { return {} }
  })
  const clean = (s) => {
    const out = { ...s }
    for (const [k, allowed] of Object.entries(choices)) {
      const list = typeof allowed === 'function' ? allowed(out) : allowed
      if (!list.includes(out[k])) out[k] = initial[k]
    }
    return out
  }
  const [state, setState] = useState(() => clean({ ...initial, ...saved, ...fromUrl }))
  const [held, setHeld] = useState(() => !!notify && !!fromUrl && Object.keys(fromUrl).length > 0)
  useEffect(() => {
    if (held) return
    try { localStorage.setItem(`ba:${key}`, JSON.stringify(state)) } catch {}
  }, [key, state, held])
  useEffect(() => {
    if (fromUrl) history.replaceState(null, '', location.pathname + location.hash)
  }, [fromUrl])
  useEffect(() => {
    if (!held) return
    notify({
      keep: () => setHeld(false),
      restore: () => { setState(clean({ ...initial, ...saved })); setHeld(false) },
    })
    return () => notify(null)
  }, [held])
  const update = (patch) => { setHeld(false); setState((s) => ({ ...s, ...patch })) }
  const reset = () => { setHeld(false); setState(initial) }
  return [state, update, reset]
}

/** Query string with the non-empty string fields of a tool's state. */
export function shareQuery(key, state) {
  const q = new URLSearchParams({ tool: key })
  for (const [k, v] of Object.entries(state)) {
    if (typeof v === 'string' && v !== '') q.set(k, v)
    else if (SHARED_LISTS.includes(k) && Array.isArray(v) && v.length) q.set(k, JSON.stringify(v))
  }
  return q.toString()
}

/** Segmented single-choice buttons. */
export function Seg({ label, value, options, onChange, compact = false }) {
  return (
    <div className={`seg${compact ? ' seg-compact' : ''}`} role="group" aria-label={label}>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value
        const text = typeof o === 'string' ? o : o.label
        return (
          <button key={v} type="button" aria-pressed={v === value} onClick={() => onChange(v)}>{text}</button>
        )
      })}
    </div>
  )
}

/** One-tap preset values shown under a field. */
export function Chips({ label, values, onPick, suffix = '' }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {values.map((v) => (
        <button key={v} type="button" className="chip" onClick={() => onPick(String(v))}>{v}{suffix}</button>
      ))}
    </div>
  )
}

/** Text field for numbers with an optional unit picker: segmented up to 4 units, dropdown above. */
export function NumField({ label, value, onChange, unit, units, onUnit, placeholder, hint, presets, presetSuffix }) {
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
          enterKeyHint="next"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {units && units.length <= 4 && <Seg label={`${label} unit`} value={unit} options={units} onChange={onUnit} compact />}
        {units && units.length > 4 && (
          <select className="select unit" aria-label={`${label} unit`} value={unit} onChange={(e) => onUnit(e.target.value)}>
            {units.map((u) => <option key={u}>{u}</option>)}
          </select>
        )}
      </div>
      {presets && <Chips label={`${label} presets`} values={presets} onPick={onChange} suffix={presetSuffix} />}
      {hint && <div className="field-hint">{hint}</div>}
      {commaNote(value) && <div className="field-hint" role="status">{commaNote(value)}</div>}
    </div>
  )
}

export function TextField({ label, value, onChange, placeholder }) {
  const id = useId()
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}><Units>{label}</Units></label>
      <input id={id} className="input" type="text" autoComplete="off" value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} />
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

/** Labelled segmented control as a form field. */
export function SegField({ label, value, options, onChange }) {
  return (
    <div className="field">
      <div className="field-label"><Units>{label}</Units></div>
      <Seg label={label} value={value} options={options} onChange={onChange} />
    </div>
  )
}

/** Result area; screen readers announce changes. */
export function Result({ children, style }) {
  return <div className="result-box" role="status" aria-live="polite" style={style}>{children}</div>
}

/** Hint, warning or error shown where the result would be. kind: hint | warn | error */
export function Msg({ kind = 'hint', children }) {
  return <div className={`msg msg-${kind}`} role={kind === 'error' ? 'alert' : undefined}>{children}</div>
}

/** Messages for the non-solving states of readInputs(). */
export function SolveHint({ input, need, total }) {
  if (input.status === 'hint') {
    return <Msg>{need === 1 ? `Fill in any one of the ${total} fields; the others are calculated.` : `Fill in any ${need} fields; the ${total - need === 1 ? 'last one is' : 'others are'} calculated.`}</Msg>
  }
  if (input.status === 'full') return <Msg>Too many fields are filled. Clear the one you want to calculate.</Msg>
  if (input.status === 'error') return <Msg kind="error">{input.message}</Msg>
  return null
}

export function Toolbar({ children }) {
  return <div className="toolbar">{children}</div>
}

export function ClearButton({ onClick, label = 'Clear' }) {
  return <button type="button" className="btn" onClick={onClick}>{label}</button>
}

export function CopyButton({ text, label = 'Copy Table' }) {
  const [result, setResult] = useState('')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setResult('Copied')
    } catch {
      setResult('Copy Failed')
    }
    setTimeout(() => setResult(''), 1500)
  }
  return <button type="button" className="btn" onClick={copy}>{result || label}</button>
}

/** Copies a link that reopens this tool with the current values. */
export function ShareButton({ toolKey, state }) {
  const hrefFor = useToolLink()
  const url = new URL(hrefFor(toolKey, shareQuery(toolKey, state)), location.href).href
  return <CopyButton text={url} label="Copy Link" />
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

/** Placeholder showing a calculated value in the empty field. */
export const calcPlaceholder = (isMissing, value, format = fmt) => (isMissing ? `= ${format(value)}` : '')
