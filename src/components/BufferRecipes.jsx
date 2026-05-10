import { useState } from 'react'
import { Field } from '../shared'

const BUFFERS = {
  '1× PBS (1L)': [
    { name: 'NaCl', amount: '8.0 g' },
    { name: 'KCl', amount: '0.2 g' },
    { name: 'Na₂HPO₄', amount: '1.44 g' },
    { name: 'KH₂PO₄', amount: '0.24 g' },
    { name: 'dH₂O', amount: 'to 1 L' },
    { name: 'pH', amount: '7.4' },
  ],
  '1× TAE (1L)': [
    { name: 'Tris base', amount: '4.84 g' },
    { name: 'Glacial acetic acid', amount: '1.14 mL' },
    { name: '0.5 M EDTA (pH 8)', amount: '2 mL' },
    { name: 'dH₂O', amount: 'to 1 L' },
  ],
  '1× TBE (1L)': [
    { name: 'Tris base', amount: '10.8 g' },
    { name: 'Boric acid', amount: '5.5 g' },
    { name: '0.5 M EDTA (pH 8)', amount: '4 mL' },
    { name: 'dH₂O', amount: 'to 1 L' },
  ],
  '1× TE (100 mL)': [
    { name: '1 M Tris-HCl (pH 8)', amount: '1 mL' },
    { name: '0.5 M EDTA (pH 8)', amount: '0.2 mL' },
    { name: 'dH₂O', amount: 'to 100 mL' },
  ],
  'LB Broth (1L)': [
    { name: 'Tryptone', amount: '10 g' },
    { name: 'Yeast extract', amount: '5 g' },
    { name: 'NaCl', amount: '10 g' },
    { name: 'dH₂O', amount: 'to 1 L' },
    { name: 'pH', amount: '7.0' },
  ],
  '10× TBS (1L)': [
    { name: 'Tris base', amount: '24.2 g' },
    { name: 'NaCl', amount: '80 g' },
    { name: 'dH₂O', amount: 'to 1 L' },
    { name: 'pH', amount: '7.6 (with HCl)' },
  ],
}

export default function BufferRecipes() {
  const [sel, setSel] = useState(Object.keys(BUFFERS)[0])

  return (
    <div>
      <Field label="Buffer">
        <select className="select" value={sel} onChange={e => setSel(e.target.value)}>
          {Object.keys(BUFFERS).map(b => <option key={b}>{b}</option>)}
        </select>
      </Field>
      <table className="table" style={{ marginTop: 8 }}>
        <tbody>
          {BUFFERS[sel].map((it, i) => (
            <tr key={i}><td>{it.name}</td><td className="highlight" style={{ textAlign: 'right' }}>{it.amount}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
