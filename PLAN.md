# Tokenized MSTR Hub — Plan (strategycoin.io)

## Site map
- **/ Dashboard**: tokenized MSTR mcap, TVL by chain, 24h volume, % of MSTR float on-chain, holders, MSTR price vs NAV / mNAV, Strategy BTC holdings.
- **/opportunities**: Carry (featured, mocked), lending/collateral (Teller, Kamino), LP pools table.
- **/tokens**: directory of variants, issuer, chains, structure, contracts (TBD after verification).
- **/learn**: FAQ / explainers (structure, eligibility, mNAV, risks, tranches).
- **/resources**: links.

## Metrics → data sources (verified 2026-10-13)
| Metric | Source | Free DefiLlama? |
|---|---|---|
| LP/lending pools with MSTR (TVL, APY) | `GET https://yields.llama.fi/pools` (200, filter symbol ~ MSTR) | YES — used in prototype |
| Token prices (e.g. MSTRx on Solana) | `GET https://coins.llama.fi/prices/current/solana:XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ` (200, ~$153) | YES (per-contract) |
| BTC price for NAV | `GET https://coins.llama.fi/prices/current/coingecko:bitcoin` (200) | YES |
| Issuer protocol TVL (xStocks, Backed, Dinari, Ondo GM, Robinhood) | `GET https://api.llama.fi/protocols` lists them; per-protocol `api.llama.fi/protocol/{slug}` | YES (issuer-level, not MSTR-specific) |
| DAT / MSTR treasury (BTC holdings, mNAV) | `api.llama.fi/treasuries` → **402 paid**; `/digital-asset-treasury/MSTR` → 404 | NO — use DefiLlama Pro ($300/mo) or strategy.com (scrape/manual) |
| MSTR equity price, shares outstanding | strategy.com dashboard; or Financial Modeling Prep / Polygon / Alpha Vantage | NO |
| Tokenized MSTR mcap, volume, holders per token | CoinGecko Pro (Analyst plan ~$129/mo): `/coins/{id}`, `/coins/{id}/market_chart`, `/onchain/networks/{net}/tokens/{addr}` (+ holders on paid tiers); or Token Terminal API (paid); or Dune/Helius/Etherscan-style RPC for holders & supply | NO |
| % float on-chain | Σ token supplies (on-chain RPC `totalSupply`) ÷ MSTR shares outstanding | Other (RPC + equity data) |
| Robinhood Chain tokens | Robinhood Chain explorer / RPC; Token Terminal (arbitrum filter) | Other |

Not verified (fetch pending/JS-rendered): tokenterminal.com, pro.teller.org, defillama DAT page details, strategy.com figures. usecarry.io is a JS bundle; content from brief.

## Stack
Next.js 14 (App Router, `output: 'export'`) on Vercel. Phase 2: ISR/Route Handlers + Vercel Cron to cache API pulls in Vercel KV/Edge Config; charts via Recharts/Lightweight-charts.

## Roadmap
1. **Static prototype** (this) — mock + build-time DefiLlama snapshot.
2. **Build-time live**: script pulls yields/coins at build; daily Vercel redeploy hook.
3. **Live API layer**: CoinGecko Pro + RPC (totalSupply per chain) + strategy.com BTC data; cron every 5–15 min.
4. **Wallet features**: connect wallet, show user's MSTR token positions, Carry deposit integration once live.
5. Alerts, mNAV history, newsletter/X feed.

## Round 3 — verified sources & endpoints (2026-10-13)
| Data | Endpoint | Free? | Notes |
|---|---|---|---|
| Per-token price, mcap, 24h volume, circulating | `api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=…` | Yes (rate-limited) | data/cg-markets.json; volume includes CEX |
| Contracts per chain | `api.coingecko.com/api/v3/coins/{id}` | Yes | data/coingecko-tokens.json |
| Robinhood Chain pools (liq, 24h vol) | `api.geckoterminal.com/api/v2/networks/robinhood/tokens/{addr}/pools`, `/pools/{id}` | Yes | STRATEGY/MSTR pool id 0xa6975f…9ca0 |
| Robinhood MSTR supply, uiMultiplier, mint/burn totals | RPC `https://rpc.mainnet.chain.robinhood.com` (`totalSupply`, `uiMultiplier()`, `eth_getLogs` Transfer from/to 0x0 in 10M-block chunks) | Yes | data/rh-mstr-onchain.json |
| Robinhood holders / contract source | robinhoodchain.blockscout.com/api/v2 | Cloudflare-blocked from server; use Blockscout PRO API (free key, `api.blockscout.com/4663/...`) | TODO |
| Arbitrum supplies | `arbitrum-one-rpc.publicnode.com` `totalSupply` | Yes | |
| Hyperliquid HIP-3 perps | POST `api.hyperliquid.xyz/info` `{"type":"perpDexs"}`, `{"type":"metaAndAssetCtxs","dex":"xyz"}` | Yes | xyz:MSTR |
| Lighter perps | `mainnet.zklighter.elliot.ai/api/v1/orderBookDetails` | Yes | |
| Kamino MSTRx / Teller TVL | `yields.llama.fi/pools`, `api.llama.fi/protocol/teller` | Yes | Teller MSTR-only not split |
| MSTR shares (approx.) | `data.sec.gov/api/xbrl/companyfacts/CIK0001050446.json` (weighted basic, Q2-26) | Yes (UA header) | Replace with point-in-time shares |
| Announcements | X API `search_posts_all` | Yes (quota) | Teller, xStocks posts |
Rebuild data: run the fetches, then `node data/build-research.js`.
