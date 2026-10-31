# 🧫 BIO-ASSIST: Wet Lab Toolkit

<p>
  <a href="https://ismailguderer.github.io/bio-assist/">
    <strong>🔗 Try the live app</strong>
  </a>
</p>

A lightweight, client-side calculator suite for everyday wet lab work. Runs entirely in the browser.

## Tools

| Group | Tools |
|---|---|
| Solutions | Molarity (any three of mass, MW, volume, concentration), Dilution (C₁V₁ = C₂V₂ in molar, mass, %, × units), Serial Dilution, Concentrated Reagents, Buffers |
| Nucleic Acids | Primer Resuspension, DNA Mass ↔ Moles ↔ Copies, A260 Quantification, Ligation |
| PCR | Master Mix (templates for PCR, qPCR, RT, or your own), qPCR Plate |
| Gels | Agarose Gel, SDS-PAGE Gel |
| Cells | Cell Seeding |
| Conversions | Unit Converter (mass ↔ molar, length ↔ MW, OD₆₀₀ ↔ cells, RPM ↔ RCF ↔ rotor radius) |

Inputs accept decimal commas and carry units. Values are kept in the browser between visits, and **Copy Link** shares a tool with its current values.

## Quick Start

```bash
npm install
npm run dev
```

## How It Is Published

The app is served as part of [ismailguderer.github.io/bio-assist](https://ismailguderer.github.io/bio-assist/): the site's build checks out this repo and renders each tool on its own page with `ToolHost` from `src/lib.js`. Each push here runs a build check and then triggers a site rebuild, using the `SITE_DISPATCH_TOKEN` secret (a fine-grained token with Contents: Read and write on the site repo).

`npm run dev` runs the standalone version of the app for development.

## Use It in Your Own Account

Forks deploy the standalone app to their own GitHub Pages; the site rebuild step only runs in this repo.

1. Fork this repo.
2. In your fork: Settings → Pages → Source: **GitHub Actions**.
3. Actions tab → enable workflows → run **Build and Deploy**.
4. The app is live at `https://<username>.github.io/<repo-name>/`; the build sets the path from the repo name.

## Structure

| Path | Contents |
|---|---|
| `src/tools.js` | Tool list: ids, names, groups, search keywords |
| `src/registry.js` | Tool id → component |
| `src/ToolHost.jsx` | Renders one tool; used by the site and by the standalone app |
| `src/components/` | One file per tool |
| `src/shared.jsx` | Inputs, unit pickers, results, saved state, share links |
| `src/units.js`, `src/data.js` | Unit tables, reagent data, templates |
| `src/ba.css` | Tool styles, scoped to `.ba` |

## Tech Stack

- React 18
- Vite 8
- Self-hosted fonts (Fontsource), no external requests
