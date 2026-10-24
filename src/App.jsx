import { useEffect, useState } from 'react'
import styles from './App.module.css'
import Molarity from './components/Molarity'
import Dilution from './components/Dilution'
import SerialDilution from './components/SerialDilution'
import UnitConverter from './components/UnitConverter'
import PCRMix from './components/PCRMix'
import BufferRecipes from './components/BufferRecipes'

const TABS = [
  { id: 'molarity', label: 'Molarity', icon: '⚗️', Panel: Molarity },
  { id: 'dilution', label: 'Dilution', icon: '💧', Panel: Dilution },
  { id: 'serial', label: 'Serial Dilution', icon: '🔬', Panel: SerialDilution },
  { id: 'units', label: 'Unit Converter', icon: '🔄', Panel: UnitConverter },
  { id: 'pcr', label: 'PCR Mix', icon: '🧬', Panel: PCRMix },
  { id: 'buffer', label: 'Buffers', icon: '🧪', Panel: BufferRecipes },
]

const tabFromHash = () => {
  const id = window.location.hash.slice(1)
  return TABS.some((t) => t.id === id) ? id : TABS[0].id
}

const THEMES = ['auto', 'light', 'dark']
const THEME_LABEL = { auto: 'Auto', light: 'Light', dark: 'Dark' }

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
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const apply = () => {
      const resolved = theme === 'auto' ? (media.matches ? 'light' : 'dark') : theme
      document.documentElement.setAttribute('data-theme', resolved)
    }
    apply()
    try { localStorage.setItem('ba-theme', theme) } catch {}
    if (theme !== 'auto') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  const next = () => setTheme((t) => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length])
  return [theme, next]
}

export default function App() {
  const [tab, setTab] = useState(tabFromHash)
  const [theme, nextTheme] = useTheme()

  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.getElementById(`tab-${tab}`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [tab])

  const select = (id) => {
    setTab(id)
    history.replaceState(null, '', `#${id}`)
  }

  return (
    <>
      <div className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandIcon} aria-hidden="true">🧫</span>
          <div>
            <div className={styles.brandTitle}>BIO-ASSIST</div>
            <div className={styles.brandSub}>Wet Lab Toolkit</div>
          </div>
        </div>
        <button className={styles.themeBtn} type="button" onClick={nextTheme}>
          Theme: {THEME_LABEL[theme]}
        </button>
      </div>

      <div className={`${styles.tabs} hide-scrollbar`} role="tablist" aria-label="Tools">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => select(t.id)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
              const i = TABS.findIndex((x) => x.id === tab)
              const n = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]
              select(n.id)
              document.getElementById(`tab-${n.id}`)?.focus()
            }}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
          >
            <span className={styles.tabIcon} aria-hidden="true">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* inactive panels are hidden, not unmounted */}
      {TABS.map(({ id, Panel }) => (
        <div
          key={id}
          id={`panel-${id}`}
          role="tabpanel"
          aria-labelledby={`tab-${id}`}
          hidden={tab !== id}
          className={styles.content}
        >
          <Panel />
        </div>
      ))}
    </>
  )
}
