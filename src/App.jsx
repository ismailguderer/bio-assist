import { useState, useEffect } from 'react'
import styles from './App.module.css'
import Molarity from './components/Molarity'
import Dilution from './components/Dilution'
import SerialDilution from './components/SerialDilution'
import UnitConverter from './components/UnitConverter'
import PCRMix from './components/PCRMix'
import Centrifuge from './components/Centrifuge'
import BufferRecipes from './components/BufferRecipes'

const TABS = [
  { id: 'molarity', label: 'Molarity', icon: '⚗️' },
  { id: 'dilution', label: 'Dilution', icon: '💧' },
  { id: 'serial', label: 'Serial Dilution', icon: '🔬' },
  { id: 'units', label: 'Unit Converter', icon: '🔄' },
  { id: 'pcr', label: 'PCR Mix', icon: '🧬' },
  { id: 'centrifuge', label: 'RPM ↔ RCF', icon: '⚙️' },
  { id: 'buffer', label: 'Buffers', icon: '🧪' },
]

const panels = { molarity: Molarity, dilution: Dilution, serial: SerialDilution, units: UnitConverter, pcr: PCRMix, centrifuge: Centrifuge, buffer: BufferRecipes }

export default function App() {
  const [tab, setTab] = useState('molarity')
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('ba-theme') || 'dark' } catch { return 'dark' }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('ba-theme', theme) } catch {}
  }, [theme])

  const Panel = panels[tab]

  return (
    <>
      <div className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>🧫</span>
          <div>
            <div className={styles.brandTitle}>BIO-ASSIST</div>
            <div className={styles.brandSub}>Wet Lab Toolkit</div>
          </div>
        </div>
        <button className={styles.themeBtn} onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </div>

      <div className={`${styles.tabs} hide-scrollbar`}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
          >
            <span className={styles.tabIcon}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        <Panel />
      </div>
    </>
  )
}
