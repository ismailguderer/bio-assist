import { Component, useMemo } from 'react'
import { PANELS } from './registry'
import { Msg, ToolContext } from './shared'

/** A stale saved value or an edited link must not blank the page: offer to reset the tool instead. */
class ToolBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { console.error(error) }
  reset = () => {
    try { localStorage.removeItem(`ba:${this.props.id}`) } catch {}
    try { history.replaceState(null, '', location.pathname + location.hash) } catch {}
    this.setState({ failed: false })
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div>
        <Msg kind="error">This tool could not read its saved values or the link you opened.</Msg>
        <button type="button" className="btn" onClick={this.reset}>Reset Tool</button>
      </div>
    )
  }
}

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
        <ToolBoundary id={id}><Panel /></ToolBoundary>
      </div>
    </ToolContext.Provider>
  )
}
