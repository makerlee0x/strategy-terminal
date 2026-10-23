# Production pointer (for agents)

**Canonical production repo:** `makerlee0x/strategy-terminal`  
**Live domain:** `strategycoin.io` / `www.strategycoin.io` (Vercel project wired to `strategy-terminal`)

This repo (`makerlee0x/strategy`) is the redesign workspace / mirror. Do not treat it as the deploy target unless Vercel is explicitly re-pointed.

When changing site code for go-live:

1. Land changes in `strategy-terminal` (that is what ships).
2. Keep this repo in sync so Maker’s local/Claude work stays aligned.
3. Metrics + charts + swap quote/execute talk to **StockTokenSwap** (`https://stocktokenswap.com`). CoinGecko and other secrets stay in STS / Vercel env — never commit keys.
4. Optional Vercel env on the production project: `STRATEGY_METRICS_URL`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `NEXT_PUBLIC_ROBINHOOD_CHAIN_RPC_URL`, `COINGECKO_API_KEY` / `COINGECKO_PLAN`, `MSTR_SHARES_BASIS`, `KV_REST_API_URL` + `KV_REST_API_TOKEN`, `CRON_SECRET`.

Old static CRT (`index.html` + `api/*.js`) has been replaced by this Next.js 14 App Router site in `strategy-terminal`.
