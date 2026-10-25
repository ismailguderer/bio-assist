import { NumField, SelectField, Msg, Result, Toolbar, ClearButton, ShareButton, usePersist, parseNum, fmt, fmtMl } from '../shared'
import { MOLAR, VOLUME } from '../units'
import { REAGENTS } from '../data'

const INITIAL = { reagent: REAGENTS[0].name, pct: String(REAGENTS[0].pct), density: String(REAGENTS[0].density), mw: String(REAGENTS[0].mw), target: '', targetUnit: 'M', volume: '', volumeUnit: 'mL' }

export default function Reagents() {
  const [s, set, reset] = usePersist('reagents', INITIAL)
  const pct = parseNum(s.pct)
  const density = parseNum(s.density)
  const mw = parseNum(s.mw)
  const target = parseNum(s.target)
  const volume = parseNum(s.volume)
  const preset = REAGENTS.find((r) => r.name === s.reagent)

  const valid = pct > 0 && pct <= 100 && density > 0 && mw > 0
  // mol/L = (% / 100) × density (g/mL) × 1000 mL/L ÷ MW (g/mol)
  const stockM = valid ? ((pct / 100) * density * 1000) / mw : null

  let make = null
  if (stockM && target > 0 && volume > 0) {
    const targetM = target * MOLAR[s.targetUnit]
    const volMl = (volume * VOLUME[s.volumeUnit]) * 1000
    make = targetM >= stockM ? { error: true } : { concMl: (targetM * volMl) / stockM, volMl }
  }

  const pick = (name) => {
    const r = REAGENTS.find((x) => x.name === name)
    set(r ? { reagent: name, pct: String(r.pct), density: String(r.density), mw: String(r.mw) } : { reagent: '' })
  }

  return (
    <div>
      <SelectField label="Reagent" value={preset ? s.reagent : ''} onChange={pick}
        options={[...REAGENTS.map((r) => r.name), { value: '', label: 'Custom' }]} />
      <div className="grid-3">
        <NumField label="Purity (% w/w)" value={s.pct} onChange={(v) => set({ pct: v, reagent: '' })} />
        <NumField label="Density (g/mL)" value={s.density} onChange={(v) => set({ density: v, reagent: '' })} />
        <NumField label="MW (g/mol)" value={s.mw} onChange={(v) => set({ mw: v, reagent: '' })} />
      </div>
      {!valid && <Msg kind="error">Purity must be 0–100% and density and MW greater than zero.</Msg>}
      {stockM && (
        <Result>
          <div className="result-label">STOCK CONCENTRATION</div>
          <div className="result-value">{fmt(stockM, 3)} M</div>
          <div className="result-note">(% ÷ 100) × density × 1000 ÷ MW; check the bottle label for the exact purity and density.</div>
        </Result>
      )}

      <h3 className="ba-sub">Dilute</h3>
      <div className="grid-2">
        <NumField label="Target Concentration" value={s.target} onChange={(v) => set({ target: v })}
          units={['M', 'mM']} unit={s.targetUnit} onUnit={(targetUnit) => set({ targetUnit })} />
        <NumField label="Final Volume" value={s.volume} onChange={(v) => set({ volume: v })}
          units={Object.keys(VOLUME)} unit={s.volumeUnit} onUnit={(volumeUnit) => set({ volumeUnit })} />
      </div>
      {stockM && (target === null || volume === null) && <Msg>Enter a target concentration and final volume to get the dilution.</Msg>}
      {make?.error && <Msg kind="error">The target is at or above the stock concentration.</Msg>}
      {make && !make.error && (
        <Result>
          <div className="result-value" style={{ fontSize: 18 }}>{fmtMl(make.concMl)} reagent + {fmtMl(make.volMl - make.concMl)} water</div>
        </Result>
      )}
      {make && !make.error && preset?.acid && <Msg kind="warn">Add acid to water, never water to acid. Work in a fume hood.</Msg>}
      <Toolbar><ShareButton toolKey="reagents" state={s} /><ClearButton onClick={reset} label="Reset" /></Toolbar>
    </div>
  )
}
