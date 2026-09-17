# Strategy Coin Terminal

Static, dependency-free site for the Strategy Coin retro terminal dashboard.

## Contents

- `index.html` — the site
- `support.js` — runtime it loads
- `assets/` — logo mark, CRT noise texture
- `standalone.html` — single self-contained file (works offline, no other files needed)
- `api/strategy-metrics.js` — Vercel serverless proxy for live metrics
- `vercel.json` — Vercel config (static, clean URLs, asset caching)
- `.nojekyll` — required so GitHub Pages serves all files as-is

No build step, no dependencies, no framework install.

## Run locally

`file://` will block the local script load, so use a static server:

    npx serve .
    # or
    python3 -m http.server 8000

For live metrics locally, use Vercel dev so `/api/strategy-metrics` is available:

    npx vercel dev

## Deploy — Vercel

    npm i -g vercel
    vercel deploy --prod

Or import the repo at vercel.com: Framework preset **Other**, build command empty,
output directory `.` (or `site` if you push the whole project).

Custom domains that should work with the same-origin metrics proxy:

- `*.vercel.app` (preview + production)
- `strategycoin.io` / `www.strategycoin.io` (once DNS is pointed at this Vercel project)

Optional env on the Vercel project:

- `STRATEGY_METRICS_URL` — override upstream (default `https://stocktokenswap.com/api/strategy-metrics`)

## Live metrics (StockTokenSwap)

The terminal reads **display-ready** JSON from same-origin `/api/strategy-metrics`.
On Vercel that function proxies to StockTokenSwap (where the CoinGecko key lives). If upstream
is down, it returns a safe fallback payload so the CRT never goes blank.

### Contract for StockTokenSwap: `GET /api/strategy-metrics`

Return JSON (strings already formatted for the CRT):

```json
{
  "ok": true,
  "asOf": "2026-09-12T15:02:00.000Z",
  "priceUsd": "$0.004036",
  "change24h": "1.01%",
  "change24hPositive": true,
  "priceMstr": "0.000030",
  "marketCap": "$4.03M",
  "fdv": "$4.03M",
  "totalSupply": "1.00B",
  "strategySupply": "1.00B",
  "liquidityUsd": "$636.48K",
  "mstrInLp": "2.17K",
  "mstrTokenized": "29.55K",
  "mstrInLpPct": "7.36%",
  "volume24h": "$695.01K",
  "holders": "1,839",
  "pairAsset": "MSTR",
  "sourceTime": "15:02:00"
}
```

`strategySupply` / `totalSupply` is Strategy Coin outstanding (not tokenized MSTR).
STS may send either; the terminal accepts both. If omitted, it derives `marketCap / priceUsd`.

Hardcode the Strategy token/pair on the STS side — do not accept arbitrary token query params.
Cache ~15s. Allow CORS from:

- `https://strategycoin.io`
- `https://www.strategycoin.io`
- `https://strategy-terminal.vercel.app`
- `https://*.vercel.app` (previews)
- `http://localhost:3000` (dev)

Keep the CoinGecko API key only in StockTokenSwap env — never in this public repo.

## Security notes (metrics)

- CoinGecko key never lives in this repo.
- `/api/strategy-metrics` is a **fixed-upstream** proxy (no user-controlled URL/query routing).
- Response is field-allowlisted display strings only (no raw market-data payload passthrough).
- Cross-origin calls require an allowlisted `Origin` (`strategycoin.io`, this project's Vercel previews, localhost). Others get `403`.
- Site-wide `X-Content-Type-Options`, `Referrer-Policy`, and frame permissions are set in `vercel.json`.

## Deploy — GitHub Pages

    git init
    git add .
    git commit -m "Strategy Coin terminal"
    git branch -M main
    git remote add origin git@github.com:<you>/<repo>.git
    git push -u origin main

Then Settings → Pages → Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.
If you push the whole project instead of this folder's contents, set the folder to `/site`.

Note: GitHub Pages will not run the Vercel `/api` function; the terminal will show
standby/fallback metrics unless you point it at the STS URL directly.

## Notes

- Fonts (ChicagoFLF, Anonymous Pro) load from CDNs. `standalone.html` has everything inlined
  if you need it fully offline.
- Metrics poll `/api/strategy-metrics` every 15s (LIVE when upstream succeeds, STANDBY otherwise).
- Interactions: POWER cuts the display to static, the knob and DIM/MID/NORM set screen
  brightness, the address chip copies the contract address, BUY NOW and EJECT open modals.
  SIZE opens the Position Readout calculator; SNAP captures a CRT metrics card and shares
  to X / Telegram / Discord (Discord copies caption + downloads PNG).
  Rail DARK/LIGHT button toggles CRT chassis theme (saved in localStorage).
- Below the pedestal: SEC Innovation Exemption bulletin for Tokenized Securities Venues
  (SEO-facing copy; not part of the CRT first viewport).
- CRT screen hugs content (no forced 72vh bezel gap); mobile stack hides pedestal shadow.
