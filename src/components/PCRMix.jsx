import { useState } from 'react'
import { Field, fmt } from '../shared'

export default function PCRMix() {
  const [nRxn, setNRxn] = useState('8')
  const [extra, setExtra] = useState('10')
  const [rxnVol, setRxnVol] = useState('25')
  const [primerStock, setPrimerStock] = useState('10')
  const [primerFinal, setPrimerFinal] = useState('0.5')
  const [templateVol, setTemplateVol] = useState('1')

  const n = parseInt(nRxn), ex = parseFloat(extra), rv = parseFloat(rxnVol)
  const ps = parseFloat(primerStock), pf = parseFloat(primerFinal), tmpl = parseFloat(templateVol)
  const valid = !isNaN(n) && !isNaN(ex) && !isNaN(rv) && !isNaN(ps) && !isNaN(pf) && !isNaN(tmpl)
    && n > 0 && rv > 0 && ps > 0 && pf > 0 && ps > pf && tmpl >= 0

  const totalN = valid ? n * (1 + ex / 100) : 0
  const primerPerRxn = valid ? (pf / ps) * rv : 0
  const mmPerRxn = valid ? rv / 2 : 0
  const nfwPerRxn = valid ? rv - mmPerRxn - 2 * primerPerRxn - tmpl : 0

  const components = valid ? [
    { name: '2× Master Mix', perRxn: mmPerRxn },
    { name: `Fwd Primer (${ps} μM)`, perRxn: primerPerRxn },
    { name: `Rev Primer (${ps} μM)`, perRxn: primerPerRxn },
    { name: 'Template DNA', perRxn: tmpl },
    { name: 'NFW', perRxn: nfwPerRxn },
  ] : []

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <Field label="# Reactions"><input className="input" type="number" value={nRxn} onChange={e => setNRxn(e.target.value)} /></Field>
        <Field label="Extra %"><input className="input" type="number" value={extra} onChange={e => setExtra(e.target.value)} /></Field>
        <Field label="Rxn vol (μL)"><input className="input" type="number" value={rxnVol} onChange={e => setRxnVol(e.target.value)} /></Field>
        <Field label="Primer stock (μM)"><input className="input" type="number" value={primerStock} onChange={e => setPrimerStock(e.target.value)} /></Field>
        <Field label="Primer final (μM)"><input className="input" type="number" value={primerFinal} onChange={e => setPrimerFinal(e.target.value)} /></Field>
        <Field label="Template (μL)"><input className="input" type="number" value={templateVol} onChange={e => setTemplateVol(e.target.value)} /></Field>
      </div>
      {valid && nfwPerRxn < 0 && (
        <div className="result-box" style={{ borderColor: '#dc2626', color: '#fca5a5', background: '#1e1010' }}>
          ⚠ NFW negative: components exceed reaction volume. Reduce template/primer final, or increase rxn vol.
        </div>
      )}
      {valid && nfwPerRxn >= 0 && (
        <div style={{ marginTop: 16 }}>
          <table className="table">
            <thead><tr><th>Component</th><th>Per rxn (μL)</th><th>×{fmt(totalN)} (μL)</th></tr></thead>
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
