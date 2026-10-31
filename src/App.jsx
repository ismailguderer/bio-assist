import { useEffect, useRef, useState } from 'react'
import styles from './App.module.css'
import ToolHost from './ToolHost'
import { TOOLS, GROUPS, matchTool } from './tools'

const THEMES = ['auto', 'light', 'dark']
const THEME_LABEL = { auto: 'Auto', light: 'Light', dark: 'Dark' }

const routeFromHash = () => {
  const id = window.location.hash.slice(1)
  return TOOLS.some((t) => t.id === id) ? id : null
}

function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const t = localStorage.getItem('ba-theme')
      return THEMES.includes(t) ? t : 'auto'
    } catch {
      return 'auto'
    }
  })

  useEffect(() => {
    if (theme === 'auto') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('ba-theme', theme) } catch {}
  }, [theme])

  const next = () => setTheme((t) => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length])
  return [theme, next]
}

function Home() {
  const [query, setQuery] = useState('')
  const search = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      const el = document.activeElement
      const typing = el && (['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) || el.isContentEditable)
      if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        search.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const found = TOOLS.filter((t) => matchTool(t, query))
  return (
    <div className={`${styles.content} ${styles.wide}`}>
      <div className={`field ${styles.search}`}>
        <label className="field-label" htmlFor="tool-search">Find a Tool</label>
        <input id="tool-search" ref={search} className="input" type="search" placeholder="e.g. primer, gel, qPCR  (press / to search)"
          value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && found[0]) window.location.hash = found[0].id }} />
      </div>
      {GROUPS.map((g) => {
        const tools = found.filter((t) => t.group === g)
        if (!tools.length) return null
        return (
          <section key={g} className={styles.group} aria-labelledby={`group-${g}`}>
            <h2 id={`group-${g}`} className={styles.groupTitle}>{g}</h2>
            <ul className={styles.cards}>
              {tools.map((t) => (
                <li key={t.id}>
                  <a className={styles.card} href={`#${t.id}`}>
                    <span className={styles.cardIcon} aria-hidden="true">{t.icon}</span>
                    <span>
                      <span className={styles.cardName}>{t.name}</span>
                      <span className={styles.cardDesc} style={{ display: 'block' }}>{t.description}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      {!found.length && <p className={styles.empty}>No tool matches “{query}”.</p>}
    </div>
  )
}

export default function App() {
  const [route, setRoute] = useState(routeFromHash)
  const [theme, nextTheme] = useTheme()

  useEffect(() => {
    const onHash = () => { setRoute(routeFromHash()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const tool = TOOLS.find((t) => t.id === route)
  useEffect(() => {
    document.title = tool ? `${tool.name} | BIO-ASSIST` : 'BIO-ASSIST | Wet Lab Toolkit'
  }, [tool])

  return (
    <div className="ba page">
      <header className={styles.header}>
        <a className={styles.brand} href="#">
          <span className={styles.brandIcon} aria-hidden="true">🧫</span>
          <span>
            <span className={styles.brandTitle} style={{ display: 'block' }}>BIO-ASSIST</span>
            <span className={styles.brandSub} style={{ display: 'block' }}>Wet Lab Toolkit</span>
          </span>
        </a>
        <button className="btn" type="button" onClick={nextTheme}>Theme: {THEME_LABEL[theme]}</button>
      </header>
      <main>
        {tool ? (
          <div className={styles.content}>
            <a className={styles.back} href="#">← All tools</a>
            <h1 className={styles.title}>{tool.name}</h1>
            <p className={styles.lead}>{tool.lead}</p>
            <ToolHost key={tool.id} id={tool.id} />
          </div>
        ) : (
          <Home />
        )}
      </main>
    </div>
  )
}
