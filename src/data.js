export const AVOGADRO = 6.02214076e23

/** Molecular weights (g/mol) of common lab reagents. */
export const COMPOUNDS = [
  ['Ammonium persulfate (APS)', 228.2],
  ['CaCl₂·2H₂O', 147.01],
  ['DTT', 154.25],
  ['EDTA disodium dihydrate', 372.24],
  ['Glucose', 180.16],
  ['Glycerol', 92.09],
  ['Glycine', 75.07],
  ['Guanidine HCl', 95.53],
  ['HEPES', 238.3],
  ['Imidazole', 68.08],
  ['IPTG', 238.3],
  ['KCl', 74.55],
  ['MgCl₂·6H₂O', 203.3],
  ['NaCl', 58.44],
  ['NaOH', 40.0],
  ['SDS', 288.38],
  ['Sucrose', 342.3],
  ['Tris base', 121.14],
  ['Tris-HCl', 157.6],
  ['Urea', 60.06],
]

/** Concentrated stock reagents: % w/w, density (g/mL), MW (g/mol). */
export const REAGENTS = [
  { name: 'Hydrochloric acid 37%', pct: 37, density: 1.19, mw: 36.46, acid: true },
  { name: 'Sulfuric acid 96%', pct: 96, density: 1.84, mw: 98.08, acid: true },
  { name: 'Nitric acid 70%', pct: 70, density: 1.42, mw: 63.01, acid: true },
  { name: 'Phosphoric acid 85%', pct: 85, density: 1.685, mw: 98.0, acid: true },
  { name: 'Acetic acid, glacial', pct: 99.7, density: 1.049, mw: 60.05, acid: true },
  { name: 'Formic acid 98%', pct: 98, density: 1.22, mw: 46.03, acid: true },
  { name: 'Ammonia solution 25%', pct: 25, density: 0.91, mw: 17.03 },
  { name: 'Sodium hydroxide 50%', pct: 50, density: 1.52, mw: 40.0 },
  { name: 'Hydrogen peroxide 30%', pct: 30, density: 1.11, mw: 34.01 },
  { name: 'β-Mercaptoethanol', pct: 99, density: 1.114, mw: 78.13 },
]

/** Nucleic acid molecular weight from length (NEBioCalculator formulas). */
export const NUCLEIC = {
  dsDNA: { unit: 'bp', mw: (n) => n * 617.96 + 36.04, length: (mw) => (mw - 36.04) / 617.96 },
  ssDNA: { unit: 'nt', mw: (n) => n * 308.97 + 18.02, length: (mw) => (mw - 18.02) / 308.97 },
  RNA: { unit: 'nt', mw: (n) => n * 320.5 + 159.0, length: (mw) => (mw - 159.0) / 320.5 },
}

/** Culture plates: wells and a typical working volume per well (mL). */
export const PLATES = {
  '6-well': { wells: 6, volume: 2 },
  '12-well': { wells: 12, volume: 1 },
  '24-well': { wells: 24, volume: 0.5 },
  '48-well': { wells: 48, volume: 0.25 },
  '96-well': { wells: 96, volume: 0.1 },
}

/** Master mix templates. kind: conc (stock -> final), fixed (µL per rxn), tube (added per tube), fill (water). */
export const MIX_TEMPLATES = {
  pcr: {
    name: 'PCR (2× master mix)',
    rxnVol: '25',
    components: [
      { name: '2× Master Mix', kind: 'conc', stock: '2', final: '1', unit: '×' },
      { name: 'Fwd Primer', kind: 'conc', stock: '10', final: '0.5', unit: 'µM' },
      { name: 'Rev Primer', kind: 'conc', stock: '10', final: '0.5', unit: 'µM' },
      { name: 'Template DNA', kind: 'tube', vol: '1' },
      { name: 'Nuclease-Free Water', kind: 'fill' },
    ],
  },
  sybr: {
    name: 'qPCR (2× SYBR Green)',
    rxnVol: '20',
    components: [
      { name: '2× SYBR Green Mix', kind: 'conc', stock: '2', final: '1', unit: '×' },
      { name: 'Fwd Primer', kind: 'conc', stock: '10', final: '0.4', unit: 'µM' },
      { name: 'Rev Primer', kind: 'conc', stock: '10', final: '0.4', unit: 'µM' },
      { name: 'cDNA', kind: 'tube', vol: '2' },
      { name: 'Nuclease-Free Water', kind: 'fill' },
    ],
  },
  taqman: {
    name: 'qPCR (2× probe mix, 20× assay)',
    rxnVol: '20',
    components: [
      { name: '2× Probe Master Mix', kind: 'conc', stock: '2', final: '1', unit: '×' },
      { name: '20× Assay', kind: 'conc', stock: '20', final: '1', unit: '×' },
      { name: 'cDNA', kind: 'tube', vol: '2' },
      { name: 'Nuclease-Free Water', kind: 'fill' },
    ],
  },
  rt: {
    name: 'Reverse transcription (generic)',
    rxnVol: '20',
    components: [
      { name: '5× RT Buffer', kind: 'conc', stock: '5', final: '1', unit: '×' },
      { name: 'dNTP Mix', kind: 'conc', stock: '10', final: '0.5', unit: 'mM' },
      { name: 'Primer (oligo dT or random)', kind: 'fixed', vol: '1' },
      { name: 'RNase Inhibitor', kind: 'fixed', vol: '0.5' },
      { name: 'Reverse Transcriptase', kind: 'fixed', vol: '1' },
      { name: 'RNA', kind: 'tube', vol: '5' },
      { name: 'Nuclease-Free Water', kind: 'fill' },
    ],
  },
  custom: {
    name: 'Custom',
    rxnVol: '20',
    components: [
      { name: 'Component', kind: 'fixed', vol: '1' },
      { name: 'Nuclease-Free Water', kind: 'fill' },
    ],
  },
}
