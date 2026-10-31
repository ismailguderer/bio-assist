import { NumField, SegField, Msg, Result, Toolbar, CopyButton, ClearButton, ShareButton, usePersist, parseNum, fmt, fmtVol, tsv } from '../shared'

const INITIAL = { pct: '1', volume: '50', buffer: 'TAE', stain: '10000' }
const CHOICES = { buffer: ['TAE', 'TBE'] }

export default function AgaroseGel() {
  const [s, set, reset] = usePersist('agarose', INITIAL, CHOICES)
  const pct = parseNum(s.pct)
  const volume = parseNum(s.volume)
  const stain = parseNum(s.stain)
  const ok = pct > 0 && volume > 0
  // % w/v = g per 100 mL
  const grams = ok ? (pct * volume) / 100 : null
  const stainUl = ok && stain > 0 ? (volume * 1000) / stain : null

  const text = ok && tsv([
    [`${fmt(pct)}% agarose gel`, `${fmt(volume)} mL`],
    ['Agarose', `${fmt(grams, 3)} g`],
    [`1× ${s.buffer}`, `to ${fmt(volume)} mL`],
    ...(stainUl ? [[`Stain (${fmt(stain)}×)`, `${fmtVol(stainUl)} µL`]] : []),
  ])

  return (
    <div>
      <NumField label="Gel (%)" value={s.pct} onChange={(v) => set({ pct: v })} presets={[0.8, 1, 1.5, 2]} presetSuffix="%" />
      <NumField label="Volume (mL)" value={s.volume} onChange={(v) => set({ volume: v })} presets={[30, 50, 100]} presetSuffix=" mL" />
      <SegField label="Buffer" value={s.buffer} options={['TAE', 'TBE']} onChange={(buffer) => set({ buffer })} />
      <NumField label="Stain Stock (×, optional)" value={s.stain} onChange={(v) => set({ stain: v })} presets={[10000, 1000]} presetSuffix="×"
        hint="e.g. SYBR Safe or GelRed at 10,000×." />

      {!ok && <Msg kind={s.pct === '' || s.volume === '' ? 'hint' : 'error'}>Enter a gel percentage and volume greater than zero.</Msg>}
      {ok && pct > 4 && <Msg kind="warn">Above 4%, agarose rarely dissolves well; check the percentage.</Msg>}
      {ok && (
        <Result>
          <div className="result-label">AGAROSE</div>
          <div className="result-value">{fmt(grams, 3)} g</div>
          <div className="result-sub">in {fmt(volume)} mL 1× {s.buffer}{stainUl !== null && `, then ${fmtVol(stainUl)} µL stain`}</div>
          <div className="result-note">Heat until fully dissolved; cool to about 55 °C before adding stain and pouring.</div>
        </Result>
      )}
      <Toolbar>{ok && <CopyButton text={text} label="Copy Recipe" />}<ShareButton toolKey="agarose" state={s} /><ClearButton onClick={reset} label="Reset" /></Toolbar>
    </div>
  )
}
