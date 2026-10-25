import { useMemo } from 'react'
import { PANELS } from './registry'
import { ToolContext } from './shared'

/** Enter in a text field moves focus to the next field. */
function nextFieldOnEnter(e) {
  if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return
  const fields = [...e.currentTarget.querySelectorAll('input, select')].filter((el) => !el.disabled && el.offsetParent !== null)
  const i = fields.indexOf(e.target)
  if (i >= 0 && i < fields.length - 1) {
    e.preventDefault()
    fields[i + 1].focus()
  }
}

/**
 * One tool, ready to embed. `base` set: tools live at <base><id>/ (e.g. /bio-assist/molarity/);
 * not set: tools are addressed by #id on the current page.
 */
export default function ToolHost({ id, base }) {
  const Panel = PANELS[id]
  const link = useMemo(() => ({
    hrefFor: base
      ? (toolId, query = '') => `${base}${toolId}/${query ? `?${query}` : ''}`
      : (toolId, query = '') => `${location.pathname}${query ? `?${query}` : ''}#${toolId}`,
  }), [base])
  if (!Panel) return null
  return (
    <ToolContext.Provider value={link}>
      <div className="ba" onKeyDown={nextFieldOnEnter}>
        <Panel />
      </div>
    </ToolContext.Provider>
  )
}
