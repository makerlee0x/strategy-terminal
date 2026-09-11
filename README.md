# Strategy Coin Terminal

Static, dependency-free site for the Strategy Coin retro terminal dashboard.

## Contents

- `index.html` — the site
- `support.js` — runtime it loads
- `assets/` — logo mark, CRT noise texture
- `standalone.html` — single self-contained file (works offline, no other files needed)
- `vercel.json` — Vercel config (static, clean URLs, asset caching)
- `.nojekyll` — required so GitHub Pages serves all files as-is

No build step, no dependencies, no framework install.

## Run locally

`file://` will block the local script load, so use a static server:

    npx serve .
    # or
    python3 -m http.server 8000

## Deploy — Vercel

    npm i -g vercel
    vercel deploy --prod

Or import the repo at vercel.com: Framework preset **Other**, build command empty,
output directory `.` (or `site` if you push the whole project).

## Deploy — GitHub Pages

    git init
    git add .
    git commit -m "Strategy Coin terminal"
    git branch -M main
    git remote add origin git@github.com:<you>/<repo>.git
    git push -u origin main

Then Settings → Pages → Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.
If you push the whole project instead of this folder's contents, set the folder to `/site`.

## Notes

- Fonts (ChicagoFLF, Anonymous Pro) load from CDNs. `standalone.html` has everything inlined
  if you need it fully offline.
- Metrics are hard-coded in `index.html`; replace the text in the readout tiles to wire up
  live data.
- Interactions: POWER cuts the display to static, the knob and DIM/MID/NORM set screen
  brightness, the address chip copies the contract address, BUY NOW and EJECT open modals.
