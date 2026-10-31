import { Component, useMemo, useState } from 'react'
import { PANELS } from './registry'
import { LinkNoticeContext, Msg, Toolbar, ToolContext, USER_DATA } from './shared'

/** A stale saved value or an edited link must not blank the page: offer to reset the tool instead. */
class ToolBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { console.error(error) }
  reset = () => {
    try {
      // keep what the user made (saved templates, rotors); drop the fields that may have broken the tool
      const key = `ba:${this.props.id}`
      const saved = JSON.parse(localStorage.getItem(key) || '{}')
      const keep = Object.fromEntries(USER_DATA.filter((k) => saved[k] && typeof saved[k] === 'object').map((k) => [k, saved[k]]))
      if (Object.keys(keep).length) localStorage.setItem(key, JSON.stringify(keep))
      else localStorage.removeItem(key)
    } catch {
      try { localStorage.removeItem(`ba:${this.props.id}`) } catch {}
    }
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

/** Enter in a text field moves focus to the next text field; selects are skipped because Enter does nothing there. */
function nextFieldOnEnter(e) {
  if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return
  const fields = [...e.currentTarget.querySelectorAll('input')].filter((el) => !el.disabled && el.offsetParent !== null)
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
  const [linkNotice, setLinkNotice] = useState(null)
  if (!Panel) return null
  return (
    <ToolContext.Provider value={link}>
      <LinkNoticeContext.Provider value={setLinkNotice}>
        <div className="ba" onKeyDown={nextFieldOnEnter}>
          {linkNotice && (
            <div>
              <Msg kind="warn">Opened from a shared link. These values are not saved yet.</Msg>
              <Toolbar>
                <button type="button" className="btn" onClick={linkNotice.keep}>Keep These Values</button>
                <button type="button" className="btn" onClick={linkNotice.restore}>Restore Mine</button>
              </Toolbar>
            </div>
          )}
          <ToolBoundary id={id}><Panel /></ToolBoundary>
        </div>
      </LinkNoticeContext.Provider>
    </ToolContext.Provider>
  )
}
