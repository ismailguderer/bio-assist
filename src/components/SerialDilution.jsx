import { useState } from 'react'
import { Field, fmt } from '../shared'

export default function SerialDilution() {
  const [stockConc, setStockConc] = useState('100')
  const [factor, setFactor] = useState('10')
  const [steps, setSteps] = useState('5')
  const [totalVol, setTotalVol] = useState('100')

  const f = parseFloat(factor), s = parseInt(steps), sc = parseFloat(stockConc), tv = parseFloat(totalVol)
  const rows = []
  if (!isNaN(f) && !isNaN(s) && !isNaN(sc) && !isNaN(tv) && f > 1 && s > 0) {
    for (let i = 0; i < s; i++) {
      rows.push({ step: i + 1, conc: sc / Math.pow(f, i + 1), transferVol: tv / f, diluentVol: tv - tv / f })
    }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Stock conc."><input className="input" type="number" value={stockConc} onChange={e => setStockConc(e.target.value)} /></Field>
        <Field label="Dilution factor"><input className="input" type="number" value={factor} onChange={e => setFactor(e.target.value)} /></Field>
        <Field label="# Steps"><input className="input" type="number" value={steps} onChange={e => setSteps(e.target.value)} /></Field>
        <Field label="Total vol/tube (µL)"><input className="input" type="number" value={totalVol} onChange={e => setTotalVol(e.target.value)} /></Field>
      </div>
      {rows.length > 0 && (
        <div style={{ marginTop: 16, overflowX: 'auto' }}>
          <table className="table">
            <thead><tr><th>Tube</th><th>Conc.</th><th>Transfer (µL)</th><th>Diluent (µL)</th></tr></thead>
            <tbody>{rows.map(r => (
              <tr key={r.step}><td>{r.step}</td><td>{fmt(r.conc)}</td><td>{fmt(r.transferVol)}</td><td>{fmt(r.diluentVol)}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
