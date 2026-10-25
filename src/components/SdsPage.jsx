import { NumField, Msg, Units, Toolbar, CopyButton, ClearButton, ShareButton, usePersist, parseNum, fmt, fmtMl, tsv } from '../shared'

const INITIAL = { pct: '12', stackPct: '5', gels: '2', resVol: '5', stackVol: '2', extra: '10' }
const ACRYLAMIDE_STOCK = 30 // % acrylamide/bis

// mL of each stock per mL of gel (Cold Spring Harbor Protocols recipe)
const resolving = (pct) => [
  ['30% Acrylamide/Bis', pct / ACRYLAMIDE_STOCK],
  ['1.5 M Tris-HCl (pH 8.8)', 0.25],
  ['10% SDS', 0.01],
  ['10% APS', 0.01],
  ['TEMED', 0.0004],
]
const stacking = (pct) => [
  ['30% Acrylamide/Bis', pct / ACRYLAMIDE_STOCK],
  ['1.0 M Tris-HCl (pH 6.8)', 0.125],
  ['10% SDS', 0.01],
  ['10% APS', 0.01],
  ['TEMED', 0.001],
]

const recipe = (rows, total) => {
  const scaled = rows.map(([name, perMl]) => [name, perMl * total])
  const water = total - scaled.reduce((sum, [, ml]) => sum + ml, 0)
  return [['Water', water], ...scaled]
}

function GelTable({ title, rows }) {
  return (
    <table className="table" style={{ marginTop: 16 }}>
      <thead><tr><th>{title}</th><th style={{ textAlign: 'right' }}><Units>Volume</Units></th></tr></thead>
      <tbody>
        {rows.map(([name, ml]) => (
          <tr key={name}><td>{name}</td><td className="highlight" style={{ textAlign: 'right' }}>{fmtMl(ml)}</td></tr>
        ))}
      </tbody>
    </table>
  )
}

export default function SdsPage() {
  const [s, set, reset] = usePersist('sdspage', INITIAL)
  const v = Object.fromEntries(Object.keys(INITIAL).map((k) => [k, parseNum(s[k])]))
  const ok = v.pct > 0 && v.pct <= 20 && v.stackPct > 0 && v.stackPct <= 10 && v.gels >= 1 && v.resVol > 0 && v.stackVol > 0 && v.extra >= 0

  let res = null
  if (ok) {
    const k = v.gels * (1 + v.extra / 100)
    res = { res: recipe(resolving(v.pct), v.resVol * k), stack: recipe(stacking(v.stackPct), v.stackVol * k), k }
  }
  const text = res && tsv([
    [`${fmt(v.pct)}% resolving gel`, ''],
    ...res.res.map(([n, ml]) => [n, fmtMl(ml)]),
    [`${fmt(v.stackPct)}% stacking gel`, ''],
    ...res.stack.map(([n, ml]) => [n, fmtMl(ml)]),
  ])

  return (
    <div>
      <div className="grid-2">
        <NumField label="Resolving Gel (%)" value={s.pct} onChange={(x) => set({ pct: x })} presets={[8, 10, 12, 15]} presetSuffix="%" />
        <NumField label="Stacking Gel (%)" value={s.stackPct} onChange={(x) => set({ stackPct: x })} presets={[4, 5]} presetSuffix="%" />
        <NumField label="Gels" value={s.gels} onChange={(x) => set({ gels: x })} presets={[1, 2, 4]} />
        <NumField label="Extra %" value={s.extra} onChange={(x) => set({ extra: x })} presets={[0, 10]} presetSuffix="%" />
        <NumField label="Resolving mL per Gel" value={s.resVol} onChange={(x) => set({ resVol: x })} hint="About 5 mL for a 1.0 mm mini gel." />
        <NumField label="Stacking mL per Gel" value={s.stackVol} onChange={(x) => set({ stackVol: x })} hint="About 2 mL for a mini gel." />
      </div>
      {!ok && <Msg kind="error">Use a resolving gel up to 20%, a stacking gel up to 10%, and volumes greater than zero.</Msg>}
      {res && (
        <div style={{ overflowX: 'auto' }}>
          <GelTable title={`${fmt(v.pct)}% Resolving`} rows={res.res} />
          <GelTable title={`${fmt(v.stackPct)}% Stacking`} rows={res.stack} />
          <ol className="steps">
            <li>Mix everything except APS and TEMED; add those last, then pour immediately.</li>
            <li>Overlay the resolving gel with isopropanol or water while it sets.</li>
          </ol>
          <Msg kind="warn">Unpolymerized acrylamide is a neurotoxin; wear gloves.</Msg>
        </div>
      )}
      <Toolbar>{res && <CopyButton text={text} label="Copy Recipe" />}<ShareButton toolKey="sdspage" state={s} /><ClearButton onClick={reset} label="Reset" /></Toolbar>
    </div>
  )
}
