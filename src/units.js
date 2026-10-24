// factors convert a value in the given unit to the base unit
export const MASS = { ng: 1e-9, 'µg': 1e-6, mg: 1e-3, g: 1 } // g
export const VOLUME = { 'µL': 1e-6, mL: 1e-3, L: 1 } // L
export const MOLAR = { M: 1, mM: 1e-3, 'µM': 1e-6, nM: 1e-9, pM: 1e-12 } // mol/L
export const MASS_CONC = { 'ng/mL': 1e-6, 'µg/mL': 1e-3, 'mg/mL': 1 } // g/L

export const toBase = (value, table, unit) => value * table[unit]
export const fromBase = (value, table, unit) => value / table[unit]

/** The same base value in the other units of a table, keeping only readable magnitudes. */
export const inOtherUnits = (base, table, skip) =>
  Object.keys(table)
    .filter((u) => u !== skip)
    .map((u) => ({ unit: u, value: base / table[u] }))
    .filter(({ value }) => Math.abs(value) >= 1e-3 && Math.abs(value) < 1e6)
