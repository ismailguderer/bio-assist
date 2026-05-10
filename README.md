# 🧫 BIO-ASSIST — Wet Lab Toolkit

<p>
  <a href="https://ismailguderer.github.io/bio-assist/">
    <strong>🔗 Try the live app</strong>
  </a>
</p>

A lightweight, client-side calculator suite for everyday wet lab work. Runs entirely in the browser.

## Tools

| Module | Description |
|---|---|
| Molarity | Mass → concentration (M, mM, µM, nM) |
| Dilution | C₁V₁ = C₂V₂ solver |
| Serial Dilution | Multi-step dilution planner with pipetting table |
| Unit Converter | µg/mL ↔ nM, bp → kDa, OD₆₀₀ → cells/mL |
| PCR Mix | Master mix calculator with extra % |
| RPM ↔ RCF | Centrifuge g-force conversion |
| Buffers | Common buffer recipes (PBS, TAE, TBE, TE, LB, TBS) |

## Quick Start

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

```bash
# 1. Create a GitHub repo named "bio-assist"
# 2. Push this code to it
# 3. Deploy:
npm run deploy
```

Your app will be live at `https://<your-username>.github.io/bio-assist/`

> **Note:** If your repo name differs from `bio-assist`, update the `base` field in `vite.config.js` accordingly.

## Tech Stack

- React 18
- Vite 5
- gh-pages (deployment)
- Zero runtime dependencies beyond React
