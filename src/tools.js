/** Tool metadata, without components. `description` is shown in lists, `lead` on the tool's own page. */
export const GROUPS = ['Solutions', 'Nucleic Acids', 'PCR', 'Gels', 'Cells', 'Conversions']

export const TOOLS = [
  { id: 'molarity', name: 'Molarity', group: 'Solutions', icon: '⚗️', description: 'Mass, molecular weight, volume, concentration: any three give the fourth.', lead: 'Weigh out a solution, or find its concentration.', keywords: 'mass weigh grams molar mol' },
  { id: 'dilution', name: 'Dilution', group: 'Solutions', icon: '💧', description: 'C₁V₁ = C₂V₂ in molar, mass, %, or × units.', lead: 'Make a working solution from a stock, in any unit.', keywords: 'c1v1 stock working 10x 1000x antibiotic' },
  { id: 'serial', name: 'Serial Dilution', group: 'Solutions', icon: '🔬', description: 'Dilution series with a pipetting table.', lead: 'Plan a dilution series and get a pipetting table.', keywords: 'series standard curve tubes' },
  { id: 'reagents', name: 'Concentrated Reagents', group: 'Solutions', icon: '🧴', description: 'Molarity of concentrated acids and bases, and how to dilute them.', lead: 'Find the molarity of a concentrated acid or base, then dilute it.', keywords: 'hcl acid base density percent ammonia naoh' },
  { id: 'buffers', name: 'Buffers', group: 'Solutions', icon: '🧪', description: 'PBS, TAE, TBE, TE, LB, TBS at any volume and strength.', lead: 'Pick a buffer, then set the volume and strength.', keywords: 'recipe pbs tae tbe tbs lb te' },
  { id: 'primers', name: 'Primer Resuspension', group: 'Nucleic Acids', icon: '🧵', description: 'Water to add for a 100 µM stock, and working dilutions.', lead: 'Resuspend a new oligo, then make a working dilution.', keywords: 'oligo nmol resuspend primer stock' },
  { id: 'nucleic', name: 'DNA Mass ↔ Moles', group: 'Nucleic Acids', icon: '🧮', description: 'ng, pmol, and copy number from length.', lead: 'Convert between mass, moles, and copies using the length.', keywords: 'ng pmol fmol copies copy number plasmid' },
  { id: 'a260', name: 'A260 Quantification', group: 'Nucleic Acids', icon: '📈', description: 'Concentration and purity ratios from absorbance.', lead: 'Get concentration and purity from absorbance readings.', keywords: 'nanodrop absorbance 260 280 230 purity' },
  { id: 'ligation', name: 'Ligation', group: 'Nucleic Acids', icon: '🔗', description: 'Insert amount for a chosen insert:vector molar ratio.', lead: 'Find how much insert to add for a chosen molar ratio.', keywords: 'cloning insert vector ratio' },
  { id: 'mastermix', name: 'Master Mix', group: 'PCR', icon: '🧬', description: 'PCR, qPCR, and RT master mixes from templates or your own.', lead: 'Start from a template or build your own; saved templates stay in this browser.', keywords: 'pcr qpcr rt cdna master mix reactions' },
  { id: 'qpcr', name: 'qPCR Plate', group: 'PCR', icon: '📊', description: 'Plate layout and wells per target for samples, replicates, standards, and NTCs.', lead: 'Plan the plate layout, then open the matching master mix.', keywords: 'qpcr plate wells replicates ntc' },
  { id: 'agarose', name: 'Agarose Gel', group: 'Gels', icon: '🟦', description: 'Agarose and stain for any percentage and volume.', lead: 'Get the agarose and stain for any gel percentage and volume.', keywords: 'agarose gel electrophoresis tae tbe sybr' },
  { id: 'sdspage', name: 'SDS-PAGE Gel', group: 'Gels', icon: '🟪', description: 'Resolving and stacking gel recipes.', lead: 'Get resolving and stacking gel recipes for any number of gels.', keywords: 'sds page acrylamide western protein gel' },
  { id: 'seeding', name: 'Cell Seeding', group: 'Cells', icon: '🧫', description: 'Hemocytometer count to cells and medium per plate.', lead: 'Turn a cell count into suspension and medium for a plate.', keywords: 'cells count hemocytometer seeding plate wells viability' },
  { id: 'units', name: 'Unit Converter', group: 'Conversions', icon: '🔄', description: 'Mass ↔ molar, length ↔ MW, OD₆₀₀ ↔ cells, RPM ↔ RCF.', lead: 'Select a conversion to begin.', keywords: 'convert rpm rcf g centrifuge od600 kda' },
]

/** Case-insensitive match on name, group, description, and keywords. */
export const matchTool = (tool, query) => {
  const q = query.trim().toLowerCase()
  return !q || `${tool.name} ${tool.group} ${tool.description} ${tool.keywords}`.toLowerCase().includes(q)
}
