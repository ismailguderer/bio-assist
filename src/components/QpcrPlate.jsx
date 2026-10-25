import { NumField, SegField, Msg, Result, Toolbar, ClearButton, ShareButton, usePersist, parseNum, useToolLink, shareQuery } from '../shared'

const INITIAL = { samples: '', targets: '2', replicates: '3', standards: '0', ntc: '3', plate: '96', chemistry: 'sybr' }

function check(s) {
  const v = Object.fromEntries(['samples', 'targets', 'replicates', 'standards', 'ntc'].map((k) => [k, parseNum(s[k])]))
  if (v.samples === null) return { hint: 'Enter the number of samples.' }
  if (Object.values(v).some((x) => x === null || !Number.isInteger(x) || x < 0)) return { error: 'Use whole numbers of zero or more.' }
  if (v.samples < 1 || v.targets < 1 || v.replicates < 1) return { error: 'Samples, targets, and replicates must be at least 1.' }
  return { v }
}

export default function QpcrPlate() {
  const [s, set, reset] = usePersist('qpcr', INITIAL)
  const hrefFor = useToolLink()
  const { v, hint, error } = check(s)

  let plan = null
  if (v) {
    const perTarget = (v.samples + v.standards) * v.replicates + v.ntc
    const wells = perTarget * v.targets
    const size = Number(s.plate)
    plan = { perTarget, wells, plates: Math.ceil(wells / size), free: size - (wells % size || size) }
  }
  const mixLink = plan && hrefFor('mastermix', shareQuery('mastermix', { template: s.chemistry, n: String(plan.perTarget) }))

  return (
    <div>
      <div className="grid-2">
        <NumField label="Samples" value={s.samples} onChange={(x) => set({ samples: x })} />
        <NumField label="Targets (genes)" value={s.targets} onChange={(x) => set({ targets: x })} hint="Include reference genes." />
        <NumField label="Replicates" value={s.replicates} onChange={(x) => set({ replicates: x })} presets={[2, 3]} />
        <NumField label="Standard Points" value={s.standards} onChange={(x) => set({ standards: x })} hint="Dilution series for efficiency; 0 if none." />
        <NumField label="NTC Wells per Target" value={s.ntc} onChange={(x) => set({ ntc: x })} presets={[1, 2, 3]} />
      </div>
      <SegField label="Plate" value={s.plate} options={[{ value: '96', label: '96-well' }, { value: '384', label: '384-well' }]} onChange={(plate) => set({ plate })} />
      <SegField label="Chemistry" value={s.chemistry} options={[{ value: 'sybr', label: 'SYBR Green' }, { value: 'taqman', label: 'Probe' }]} onChange={(chemistry) => set({ chemistry })} />

      {hint && <Msg>{hint}</Msg>}
      {error && <Msg kind="error">{error}</Msg>}
      {plan && (
        <Result>
          <div className="result-label">REACTIONS PER TARGET</div>
          <div className="result-value">{plan.perTarget}</div>
          <div className="result-sub">
            {plan.wells} wells in total; {plan.plates === 1 ? `fits one ${s.plate}-well plate with ${plan.free} wells free` : `needs ${plan.plates} ${s.plate}-well plates`}
          </div>
          <div className="result-note">(samples + standards) × replicates + NTC, for each target</div>
        </Result>
      )}
      {plan && (
        <Toolbar>
          <a className="btn btn-primary" href={mixLink}>Open Master Mix for {plan.perTarget} Reactions</a>
        </Toolbar>
      )}
      <Toolbar><ShareButton toolKey="qpcr" state={s} /><ClearButton onClick={reset} label="Reset" /></Toolbar>
    </div>
  )
}
