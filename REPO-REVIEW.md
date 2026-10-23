# Repo review — strategycoin.io code (read-only, 2026-10-13)

## 0. Where the code actually is
- **`makerlee0x/strategy` is EMPTY** (GitHub 409 "Git Repository is empty"; 0 branches). Description: "A perpetual digital dividend for tokenized stocks funded by derivative trading volume." No code, no contracts.
- **Live site code is in `makerlee0x/strategy-terminal`** (public; GitHub marks it a fork; default `main` @ `75a0d1b`). Reviewed via GitHub MCP + public tarball → `/workspace/strategy-review/strategy-terminal-main/` (read only, nothing written to GitHub).

## 1. Structure / build / deploy
| Path | Role |
|---|---|
| `index.html` (121 KB) | Whole site: CRT terminal UI, inline component logic (state, polling, modals, news/market/pools panels, SEC bulletin copy) |
| `support.js` | Runtime loaded by index.html (template/`sc-if` binding engine) |
| `standalone.html` | Fully inlined offline copy |
| `assets/` | `swap.js` + `swap.css` (prebuilt widget), logos, OG cards, `tv-noise.png` |
| `swap/src/main.js` + `swap/package.json` | Swap widget source (viem 2.x), built with esbuild → `assets/swap.js` (IIFE global `StrategySwap`) |
| `api/_guard.js` | Shared rate-limit (per-IP fixed window, in-memory), single-flight cache, bot UA check, referer/origin check |
| `api/strategy-metrics.js` | Proxy → `https://stocktokenswap.com/api/strategy-metrics` |
| `api/pools.js` | GeckoTerminal STRATEGY pools (Robinhood) |
| `api/charts.js` | Proxy → `https://stocktokenswap.com/api/charts/:token` |
| `api/x-feed.js` | @strategystock posts via `api.fxtwitter.com` |
| `vercel.json` | `framework: null`, `cleanUrls`, security headers, `/assets/*` immutable cache, `/api/*` `s-maxage=60, stale-while-revalidate=300` |
- No root package.json → Vercel deploys static files + `api/*.js` Node serverless functions; no build step (swap bundle is committed).
- Env var **names** (README/.env.example): `STRATEGY_METRICS_URL` (optional upstream override), `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `NEXT_PUBLIC_ROBINHOOD_CHAIN_RPC_URL`. Note: swap/src/main.js currently hardcodes a WalletConnect project id (public client id, not a secret) and the Robinhood RPC rather than reading env.
- Branches: `main` + 18 `cursor/*-6944` agent branches (swap-widget-embed, relay-native-swap, swap-wallets-fees, swap-deploy-fix, metrics-poll-throttle, pools…), `makerlee0x-patch-1`, 2 `vercel/*` analytics branches.
- Recent commits: 2026-10-01 Vercel Web Analytics (PR #39, merged by maker lee); 2026-09-23 pools clickable / pools in terminal / simplify terminal (PRs #36–38, Cursor Agent via cursor[bot]); 2026-09-22 STRATEGY Arcade (later removed); 2026-09-18 chart+pools strips. Authors seen: maker lee, Cursor Agent/cursor[bot], Vercel. **No commits by "Dylan" in this repo** — his work is evidently the separate StockTokenSwap backend.

## 2. Frontend data flow
- **Metrics**: `index.html` polls same-origin `/api/strategy-metrics` (POLL_MS = 60000 in current code; README still says 15 s) and also on tab visibility change. LIVE when upstream ok, else STANDBY/fallback. Fields: priceUsd, change24h(+1h/6h), priceMstr, marketCap, fdv, totalSupply/strategySupply, liquidityUsd, mstrInLp, mstrTokenized, mstrInLpPct, volume24h, holders, pairAsset, sourceTime — all **pre-formatted strings** computed by STS.
- **Pools** panel → `/api/pools`; **Market** chart → `/api/charts`; **News** → `/api/x-feed`.
- **Swap widget** (`swap/src/main.js`): calls `https://stocktokenswap.com` **directly from the browser** (not proxied): `GET /api/swap/tokens?term=&limit=24[&chainId=4663]`, `POST /api/swap/quote`, `POST /api/swap/execute` (returns Relay-style `requestId` + `steps[].items[].data` txs, signed via viem `sendTransaction`), `POST /api/swap/status` (report txHash), `GET /api/swap/intent-status?requestId=` (poll 2 s × 90). Modes buy / sell / bridge (bridge = ETH on chain 1 → ETH on 4663). Wallets: EIP-6963 injected + WalletConnect (dynamic import from esm.sh). Header comment: "Fees stay on STS"; widget only displays `fees.interfaceFeeUsd/Bps`, `totalImpactPct`, `routeLabels`; honours `swapsEnabled === false` / `executionAllowed`.

## 3. Backend
- **The swap backend and the metrics computation are NOT in this repo.** They live on **stocktokenswap.com** (STS — presumably Dylan's). This repo only has thin proxies.
- STS facts observable from this repo + live probes:
  - `/api/strategy-metrics`: STS holds the **CoinGecko API key** ("Keep the CoinGecko API key only in StockTokenSwap env"); README asks STS to cache ~15 s and CORS-allow strategycoin.io, www, strategy-terminal.vercel.app, *.vercel.app previews, localhost:3000. Live probe: other origins → `403 origin_not_allowed`.
  - `/api/swap/*`: Relay-based (requestId/intent-status/steps; Relay icons), **fee injection on STS** (.env.example: "fee injection lives on StockTokenSwap") — interface fee bps and **fee recipient are not visible here**. Kill switch: `swapsEnabled` / `executionAllowed` flags returned by STS.
  - `/api/charts/:token`: CoinGecko-sourced candles (resolution 15/60/240, days 1/7/30).
- Local proxies (`api/*`): origin allowlist (strategycoin.io, www, strategy-terminal*.vercel.app, localhost 3000/5173, 127.0.0.1 3000/8000/8765), rate limits 30–40/min browser, 10–12/min anon, in-isolate cache 45–60 s, field allowlisting, hardcoded fallback metrics (stale Sept values: $0.004036 etc.). `pools.js` hits GeckoTerminal directly (no key). `x-feed.js` scrapes fxtwitter (no key).
- Holders figure comes from STS (source not visible; likely CoinGecko onchain Pro / Blockscout).

## 4. Other
- No smart contracts in either repo. "Perpetual digital dividend … funded by derivative trading volume" exists only as the empty repo's description — no mechanism code found.
- index.html also carries SEO copy about an SEC Innovation Exemption for tokenized-securities venues, news bulletin, ticker quotes, theme toggle, Vercel Analytics.

## 5. Integration plan (mstr-hub → strategycoin.io)
1. **Target repo**: decide between filling empty `makerlee0x/strategy` or a branch on `strategy-terminal` (Vercel project is wired to strategy-terminal + strategycoin.io domain).
2. Convert mstr-hub from `output:'export'` to normal Next.js on Vercel (keeps static pages via SSG/ISR) **or** keep export and keep the existing `api/*.js` functions at repo root (Vercel supports both only if not a Next project). Recommended: Next.js App Router with Route Handlers re-implementing `/api/strategy-metrics`, `/api/pools`, `/api/charts`, `/api/x-feed` (port `_guard.js` logic verbatim) so paths/contract stay identical.
3. Swap: our `app/strategy/Swap.js` already speaks the STS contract; add WalletConnect (same project id, from env), balances, token picker via `/api/swap/tokens`, and only quote after wallet connect (STS may require `user`).
4. Replace build-time snapshots with live data:
   - STRATEGY page → `/api/strategy-metrics` (+ `/api/pools`, `/api/charts`) — **existing backend covers it**.
   - Dashboard/tokens (tokenized MSTR mcap/volume/circ) → new route `/api/mstr-tokens` (CoinGecko `/coins/markets`, free or STS key), cached 5 min.
   - Robinhood MSTR supply/mint/burn/uiMultiplier → new route using Robinhood RPC (cache 10 min; incremental log scan).
   - Perps → Hyperliquid `info` + Lighter `orderBookDetails` (free, no key).
   - DeFi pools/Kamino/Teller → DefiLlama yields/protocol (free).
5. Keep old CRT at `/terminal` during transition; keep `/assets/swap.js` URL alive (other embeds?), redirects for old anchors.
6. Ask STS to add any new domain/preview pattern to its CORS allowlist before launch.

### Risks
- STS is a single external dependency (metrics, swap, charts); no SLA, no code visibility; CORS allowlist controls whether our site works.
- In-memory rate limits are per-isolate (weak); fallback payload shows stale Sept numbers as if real — label or remove.
- Fee recipient / interface fee amount unknown to us — must be confirmed before advertising "creator fees".
- WalletConnect id + RPC hardcoded; esm.sh runtime import is a supply-chain risk.
- Next.js migration changes Vercel framework preset (`framework: null` today).

### Questions for user / Dylan
1. Which repo/Vercel project should the redesign land in (`strategy` vs `strategy-terminal`)? Is Dylan's STS code in another (private) repo we can see?
2. STS interface fee bps, fee recipient address, and how creator fees (~$1k/$1M) are split/paid?
3. Does `/api/swap/quote` require `user` (connected wallet)? Rate limits on STS? Can STS whitelist new origins (preview URLs)?
4. Source of `holders` and `mstrTokenized` (CoinGecko onchain? Blockscout?) and refresh cadence.
5. Can STS expose raw numbers (not only formatted strings) for charts/visuals?
6. What is the "perpetual digital dividend … funded by derivative trading volume" mechanism — planned contracts?
7. Keep the CRT terminal as a secondary page, or retire it?
