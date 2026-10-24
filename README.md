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
| Molarity | Mass, molecular weight, volume, concentration: fill any three, get the fourth |
| Dilution | C₁V₁ = C₂V₂: fill any three, get the fourth and the diluent volume |
| Serial Dilution | Dilution series with equal final volume per tube and a pipetting table |
| Unit Converter | Mass ↔ molar concentration, length ↔ molecular weight (DNA, RNA, protein), OD₆₀₀ ↔ cells/mL |
| PCR Mix | Master mix for N reactions plus extra %, template added per tube |
| RPM ↔ RCF | Centrifuge speed ↔ g-force for a given rotor radius |
| Buffers | PBS, TAE, TBE, TE, LB, TBS, scaled to any volume and strength |

Inputs accept decimal commas, carry units, and are kept in the browser between visits.

## Quick Start

```bash
npm install
npm run dev
```

## Deploy

Every push to `main` builds the app and deploys it to GitHub Pages through GitHub Actions (`.github/workflows/deploy.yml`).

> **Note:** If your repo name differs from `bio-assist`, update the `base` field in `vite.config.js` accordingly.

## Tech Stack

- React 18
- Vite 5
- Self-hosted fonts (Fontsource), no external requests
