# STRATEGY COIN — strategycoin.io

Next.js 14 (App Router) hub for `$STRATEGY` and tokenized MSTR. Deploys on Vercel as a normal Next.js app.

**Production:** see `PROD.md`. Live site ships from `makerlee0x/strategy-terminal`.

## Setup

```
npm install
cp .env.example .env.local   # optional
npm run dev                  # http://localhost:3000
npm run build
```

Requires Node 18.17+.

## Environment

All secrets stay in Vercel / local `.env.local`. Never commit real keys.

| Name | Purpose |
|---|---|
| STRATEGY_METRICS_URL | Upstream metrics (default `https://stocktokenswap.com/api/strategy-metrics`) |
| NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID | WalletConnect in swap (optional; built-in default exists) |
| NEXT_PUBLIC_ROBINHOOD_CHAIN_RPC_URL | Robinhood Chain RPC |
| COINGECKO_API_KEY / COINGECKO_PLAN | Optional; `demo` or `pro` |
| MSTR_SHARES_BASIS | Share count for on-chain % figure |
| VERCEL_PREVIEW_PREFIX | Origin allowlist for `*.vercel.app` previews |
| KV_REST_API_URL / KV_REST_API_TOKEN | Daily pool history (chart + 30D yield) |
| CRON_SECRET | Bearer for `/api/cron/snapshot` |

## Pages

`/` home · `/strategy` ($STRATEGY pool + metrics) · `/mstr` (MSTR on-chain utility) · `/8k` (8-K day) · `/terminal` (interactive CRT + in-terminal swap). Old paths (`/earn`, `/opportunities`, `/learn`, `/resources`, `/tokens`) redirect to `/mstr`.

## APIs (server-cached, rate-limited, origin-checked)

Same-origin routes. Upstream market data for `$STRATEGY` metrics comes from StockTokenSwap (keys stay there).

| Route | Source |
|---|---|
| `/api/strategy-metrics` | stocktokenswap.com |
| `/api/pools` | GeckoTerminal |
| `/api/pool-backing` | DexScreener + launch curve |
| `/api/strategy-history` | KV daily snapshots |
| `/api/mstr-tokens` | CoinGecko markets |
| `/api/robinhood-mstr` | Robinhood / Arbitrum RPC |
| `/api/perps` | Hyperliquid + Lighter |
| `/api/chains` | venue volume |
| `/api/offhours` | off-hours volume share |
| `/api/strategy-filings` | SEC 8-K |
| `/api/cron/snapshot` | nightly history write |

Swap quote / execute / status calls StockTokenSwap `/api/swap/*` from the browser on strategycoin.io.

When an upstream fails, routes return `delayed: true` and last good data when available. UI shows DATA DELAYED — no invented fallback figures.

Not affiliated with, endorsed by, or sponsored by Strategy Inc. Informational only, not investment advice.
