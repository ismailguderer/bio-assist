import { useState } from 'react'
import { Field, fmt } from '../shared'

export default function PCRMix() {
  const [nRxn, setNRxn] = useState('8')
  const [extra, setExtra] = useState('10')
  const [rxnVol, setRxnVol] = useState('25')

  const n = parseInt(nRxn), ex = parseFloat(extra), rv = parseFloat(rxnVol)
  const valid = !isNaN(n) && !isNaN(ex) && !isNaN(rv) && n > 0 && rv > 0
  const totalN = valid ? n * (1 + ex / 100) : 0

  const components = valid ? [
    { name: '2× Master Mix', perRxn: rv / 2 },
    { name: 'Fwd Primer (10 µM)', perRxn: rv * 0.02 },
    { name: 'Rev Primer (10 µM)', perRxn: rv * 0.02 },
    { name: 'Template DNA', perRxn: 1 },
    { name: 'NFW', perRxn: rv - rv / 2 - rv * 0.04 - 1 },
  ] : []

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <Field label="# Reactions"><input className="input" type="number" value={nRxn} onChange={e => setNRxn(e.target.value)} /></Field>
        <Field label="Extra %"><input className="input" type="number" value={extra} onChange={e => setExtra(e.target.value)} /></Field>
        <Field label="Rxn vol (µL)"><input className="input" type="number" value={rxnVol} onChange={e => setRxnVol(e.target.value)} /></Field>
      </div>
      {valid && (
        <div style={{ marginTop: 16 }}>
          <table className="table">
            <thead><tr><th>Component</th><th>Per rxn (µL)</th><th>×{fmt(totalN)} (µL)</th></tr></thead>
            <tbody>
              {components.map(c => (
                <tr key={c.name}><td>{c.name}</td><td>{fmt(c.perRxn)}</td><td className="highlight">{fmt(c.perRxn * totalN)}</td></tr>
              ))}
              <tr><td className="total">Total</td><td className="total">{fmt(rv)}</td><td className="total">{fmt(rv * totalN)}</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
