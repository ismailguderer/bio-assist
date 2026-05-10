# BIO-ASSIST

Browser-based calculator toolkit for common wet lab calculations. No backend, no login, everything runs client-side.

## Tools

| Module | What it does |
|---|---|
| Molarity | mass to concentration (M, mM, uM, nM) |
| Dilution | C1V1 = C2V2 solver |
| Serial Dilution | multi-step dilution planner with pipetting volumes |
| Unit Converter | ug/mL to nM, bp to kDa, OD600 to cells/mL |
| PCR Mix | master mix calculator with overage % |
| RPM / RCF | centrifuge g-force conversion |
| Buffers | common buffer recipes (PBS, TAE, TBE, TE, LB, TBS) |

## Setup

```bash
npm install
npm run dev
```

Deployment is handled via GitHub Actions on push to `main`. See `.github/workflows/deploy.yml`.

## Stack

React 18, Vite 5. No additional runtime dependencies.
