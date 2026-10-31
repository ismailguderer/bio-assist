import { NumField, SelectField, SegField, Msg, Toolbar, CopyButton, ClearButton, ShareButton, usePersist, parseNum, fmt, tsv } from '../shared'
import { VOLUME } from '../units'

const NA2HPO4 = {
  anhydrous: { label: 'Na₂HPO₄ (anhydrous)', mw: 141.96 },
  dihydrate: { label: 'Na₂HPO₄·2H₂O', mw: 177.99 },
  heptahydrate: { label: 'Na₂HPO₄·7H₂O', mw: 268.07 },
  dodecahydrate: { label: 'Na₂HPO₄·12H₂O', mw: 358.14 },
}

// amounts are for `volume` litres at `strength`×; solids in g, liquids in mL
const BUFFERS = {
  PBS: {
    volume: 1, strength: 1, strengths: [1, 10],
    final: '137 mM NaCl, 2.7 mM KCl, 10 mM Na₂HPO₄, 1.8 mM KH₂PO₄',
    rows: [
      { name: 'NaCl', g: 8.0 },
      { name: 'KCl', g: 0.2 },
      { name: 'Na₂HPO₄', mmol: 1.44 / 141.96 * 1000, hydrate: true },
      { name: 'KH₂PO₄', g: 0.24 },
    ],
    pH: '7.4',
  },
  TAE: {
    volume: 1, strength: 1, strengths: [1, 10, 50],
    final: '40 mM Tris, 20 mM acetate, 1 mM EDTA',
    rows: [
      { name: 'Tris base', g: 4.84 },
      { name: 'Glacial acetic acid', mL: 1.142 },
      { name: '0.5 M EDTA (pH 8)', mL: 2 },
    ],
  },
  TBE: {
    volume: 1, strength: 1, strengths: [0.5, 1, 5, 10],
    final: '89 mM Tris, 89 mM borate, 2 mM EDTA',
    rows: [
      { name: 'Tris base', g: 10.8 },
      { name: 'Boric acid', g: 5.5 },
      { name: '0.5 M EDTA (pH 8)', mL: 4 },
    ],
  },
  TE: {
    volume: 0.1, strength: 1, strengths: [1, 10],
    final: '10 mM Tris-HCl, 1 mM EDTA, pH 8',
    rows: [
      { name: '1 M Tris-HCl (pH 8)', mL: 1 },
      { name: '0.5 M EDTA (pH 8)', mL: 0.2 },
    ],
  },
  'LB Broth': {
    volume: 1, strength: 1, strengths: [1],
    final: '1% tryptone, 0.5% yeast extract, 171 mM NaCl',
    rows: [
      { name: 'Tryptone', g: 10 },
      { name: 'Yeast extract', g: 5 },
      { name: 'NaCl', g: 10 },
    ],
    pH: '7.0',
  },
  TBS: {
    volume: 1, strength: 10, strengths: [1, 10],
    final: '50 mM Tris, 150 mM NaCl',
    rows: [
      { name: 'Tris base', g: 60.55 },
      { name: 'NaCl', g: 87.66 },
    ],
    pH: '7.6 (with HCl)',
  },
}

const INITIAL = { buffer: 'PBS', volume: '1', volumeUnit: 'L', strength: '1', hydrate: 'anhydrous' }

const CHOICES = { buffer: Object.keys(BUFFERS), volumeUnit: Object.keys(VOLUME), hydrate: Object.keys(NA2HPO4) }

const showMass =(g) => (g < 1 ? `${fmt(g * 1000, 3)} mg` : `${fmt(g, 4)} g`)
const showLiquid = (mL) => (mL < 1 ? `${fmt(mL * 1000, 3)} µL` : `${fmt(mL, 4)} mL`)

export default function BufferRecipes() {
  const [s, set, reset] = usePersist('buffers', INITIAL, CHOICES)
  const buf = BUFFERS[s.buffer]
  const strength = buf.strengths.includes(Number(s.strength)) ? Number(s.strength) : buf.strengths[0]
  const vol = parseNum(s.volume)
  const litres = vol > 0 ? vol * VOLUME[s.volumeUnit] : null
  const scale = litres ? (litres / buf.volume) * (strength / buf.strength) : null

  const rows = scale && buf.rows.map((r) => {
    if (r.hydrate) {
      const h = NA2HPO4[s.hydrate]
      return { name: h.label, amount: showMass((r.mmol / 1000) * h.mw * scale) }
    }
    return { name: r.name, amount: r.g !== undefined ? showMass(r.g * scale) : showLiquid(r.mL * scale) }
  })
  const liquidMl = scale ? buf.rows.reduce((sum, r) => sum + (r.mL ?? 0) * scale, 0) : 0
  const tooConcentrated = scale && liquidMl >= litres * 1000
  const fill = `to ${fmt(vol)} ${s.volumeUnit}`

  const text = rows && tsv([
    [`${strength}× ${s.buffer}`, fill],
    ...rows.map((r) => [r.name, r.amount]),
    ['dH₂O', fill],
    ...(buf.pH ? [['pH', buf.pH]] : []),
  ])

  return (
    <div>
      <SegField label="Buffer" value={s.buffer} onChange={(buffer) => set({ buffer, strength: String(BUFFERS[buffer].strengths[0]) })}
        options={Object.keys(BUFFERS)} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        <NumField label="Final Volume" value={s.volume} onChange={(volume) => set({ volume })}
          units={Object.keys(VOLUME)} unit={s.volumeUnit} onUnit={(volumeUnit) => set({ volumeUnit })} />
        <SegField label="Strength" value={String(strength)} onChange={(v) => set({ strength: v })}
          options={buf.strengths.map((x) => ({ value: String(x), label: `${x}×` }))} />
      </div>
      {s.buffer === 'PBS' && (
        <SelectField label="Phosphate Form (Na₂HPO₄)" value={s.hydrate} onChange={(hydrate) => set({ hydrate })}
          options={Object.entries(NA2HPO4).map(([value, h]) => ({ value, label: h.label }))} />
      )}

      <div className="result-note" style={{ marginTop: 4, marginBottom: 12, fontStyle: 'italic' }}>
        Composition at 1×: {buf.final}
        {strength > 1 && ` (this is a ${strength}× stock; dilute 1:${strength} for use)`}
      </div>

      {vol === null && <Msg>Enter the final volume.</Msg>}
      {vol !== null && !(vol > 0) && <Msg kind="error">Final volume must be a number greater than zero.</Msg>}
      {tooConcentrated && <Msg kind="error">The liquid stocks alone exceed the final volume; this strength cannot be made from these stocks.</Msg>}
      {rows && !tooConcentrated && (
        <>
          <table className="table">
            <tbody>
              {rows.map((r) => (
                <tr key={r.name}><td>{r.name}</td><td className="highlight" style={{ textAlign: 'right' }}>{r.amount}</td></tr>
              ))}
              <tr><td>dH₂O</td><td className="highlight" style={{ textAlign: 'right' }}>{fill}</td></tr>
              {buf.pH && <tr><td>pH</td><td className="highlight" style={{ textAlign: 'right' }}>{buf.pH}</td></tr>}
            </tbody>
          </table>
          <Toolbar><CopyButton text={text} label="Copy Recipe" /><ShareButton toolKey="buffers" state={s} /></Toolbar>
        </>
      )}
      <Toolbar><ClearButton onClick={reset} label="Reset" /></Toolbar>
    </div>
  )
}
