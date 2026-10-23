# Michael Saylor on tokenization / tokenized MSTR — research (Oct 14, 2026)

Method: X API (`from:saylor` searches, post lookups), fxtwitter for full long-post text, and news coverage. I could not watch the videos. Video posts are summarized from Saylor's own timestamp chapters, which are his wording but not transcripts. Every quote below is verbatim from the linked source. **Paraphrases are marked as such.**

## Verified quotes

| # | Date | Quote | Source |
|---|---|---|---|
| 1 | 2026-09-17 | "The SEC's innovation exemption enables 24/7 onchain trading of tokenized $STRC and $MSTR for U.S. investors through qualifying venues. A major breakthrough for Digital Credit and American capital markets." | https://x.com/saylor/status/2100592535991091385 |
| 2 | 2026-10-08 | "Four of CoinGecko's top 10 tokenized stocks are based on $MSTR and $STRC. Digital Equity and Digital Credit are going global." | https://x.com/saylor/status/2108218466406908057 |
| 3 | 2026-10-08 | (reply to xStocks: "$STRCx is now the world's largest tokenized equity…") "The digital world wants Digital Credit. $STRC" | https://x.com/saylor/status/2108192020854661431 |
| 4 | 2026-05-21 (CNBC Squawk Box) | "The real power of tokenization is it creates a free market in credit formation and yield for asset owners. So if you can tokenize a bunch of securities, then you can shop for the best credit terms and the highest yield." | https://www.cnbc.com/2026/05/21/strategys-michael-saylor-says-tokenization-will-let-investors-shop-for-yield.html |
| 5 | 2026-05-21 (CNBC) | "In the 20th century TradFi economy your bank decides you just won't get credit, you just won't get yield, and there's not a single thing you can do about it." CNBC then quotes: "So tokenization is a free market in capital, and it creates a higher velocity and a higher volatility for capital assets." (A ceointerviews.ai transcript renders the last word as "productivity", so the exact wording is uncertain.) | same as 4 |
| 6 | 2026-05-29 | "CFTC guidance advances Bitcoin capital markets: 24/7 trading, BTC collateral, perpetual futures, options, and regulated access. Good for $BTC holders, powers the $MSTR engine, and supports the rise of $STRC as Bitcoin-backed Digital Credit." | https://x.com/saylor/status/2060385570782679369 |
| 7 | 2026-06-09 | "Bitcoin-backed credit instruments compete with fiat and crypto yield products, not with Bitcoin. When capital moves from fiat/crypto collateral into BTC-backed instruments, it strengthens the Bitcoin network." | https://x.com/saylor/status/2064431787565105181 |
| 8 | 2026-05-11 | "Transparency is a feature, not a bug, making $BTC suitable as global collateral." | https://x.com/saylor/status/2053977368071393530 |
| 9 | 2026-10-04 | "$BTC offers direct ownership, $MSTR amplified exposure, and $STRC income with less 30-day price volatility than every Mag 7 stock. Digital Capital is the foundation for Digital Equity and Digital Credit." | https://x.com/saylor/status/2106858356656779529 |
| 10 | 2026-10-13 | "Bitcoin is raw financial energy. Strategy transforms it into Digital Credit." | https://x.com/saylor/status/2110063356262469912 |
| 11 | 2026-10-06 | "Since Strategy adopted the Bitcoin Standard in 2020, Digital Equity ($MSTR) and Digital Capital ($BTC) have delivered 52% and 38% annualized returns…" | https://x.com/saylor/status/2107443970607612398 |

### Talks (chapter titles are Saylor's own post text, not transcripts)
- **DC Fintech Week at the World Bank, with Chris Brummer, 2026-10-13** (the requested post): https://x.com/saylor/status/2110021321975308351. A 21-minute video. Chapters include:
  - "Strategy as a reserve institution built on Digital Capital, Digital Credit, and Digital Equity"
  - "Strategy as a private central bank for the crypto economy"
  - "How Digital Credit amplifies Bitcoin per share for $MSTR equity holders"
  - "The triple reflexive flywheel: Bitcoin price, reserves, credit risk, and equity premiums"

  The post does not mention tokenization explicitly. We need a transcript to quote it on that.
- **Freedom Tech DC, 2026-09-24:** https://x.com/saylor/status/2103103397050077313. Chapters include:
  - "Digital tokens, capital formation, and 10 million new companies"
  - "Tokenized securities, self-custody, and competitive credit"
  - "AI agents, 24/7 markets, and 20th-century financial rails"
- **BTC Prague keynote "Bitcoin Capitalism", 2026-06-15:** https://x.com/saylor/status/2066558321394426082. Covers a "10-dimensional model" whose asset types include "tokens", plus "8) Liquidity: transforming $350T of illiquid capital with liquid digital assets", and "Build a ₿ridge to connect $BTC to the global capital markets".
- **Schwab Network, around 2026-05-21** (posted 2026-05-27): https://x.com/saylor/status/2059629992703656435. Covers "the convergence of DeFi and TradFi".
- **X Articles worth reading for longer quotes** (the text sits behind X Articles, so I couldn't fetch it):
  - "Digital Assets After CLARITY: The Best Protection Is Adoption" (2026-09-19, https://x.com/saylor/status/2101358105795711331)
  - "How Strategy Engineers Digital Credit" (2026-09-29, https://x.com/saylor/status/2104928239428706514)
  - "Bitcoin, Digital Credit, and Digital Money" (2026-06-16, https://x.com/saylor/status/2066770709569798353)

## Recurring themes
1. **Vocabulary:** Digital Capital (BTC), Digital Credit (STRC and other preferreds), Digital Equity (MSTR). Tokenization takes all three "global".
2. **24/7 onchain markets** unlocked by regulation (SEC innovation exemption, CFTC guidance, CLARITY), and 20th-century rails replaced.
3. **Tokenization as a free market in credit and yield:** "shop" for the best terms, and capital velocity and productivity go up.
4. **Collateral:** BTC as transparent global collateral, and BTC-backed instruments drawing capital away from fiat and crypto yield products.
5. **Scoreboards:** he shares leaderboards and comparisons (CoinGecko top-10 tokenized stocks, MSTR vs Mag 7 and asset classes, volatility comparisons).
6. **Weekly cadence:** an 8-K style "acquired X BTC… we hold N BTC and $X of USD Assets", plus monthly STRC dividend-rate posts.
7. **Flywheel and per-share framing:** BTC per share, mNAV / equity premium, credit amplifying BTC per share.

## Metrics and charts he regularly shares → what to build
| His metric or chart | Site element | Data source |
|---|---|---|
| "Four of CoinGecko's top 10 tokenized stocks" | **Tokenized-stock leaderboard** that highlights MSTR and STRC tokens (rank, mcap, volume) | CoinGecko `tokenized-stock` category (we already call /coins/markets) |
| STRCx "largest tokenized equity" | Add **STRCx and other STRC tokens** to /tokens and a "Digital Credit on-chain" panel | CoinGecko and xStocks contracts |
| 24/7 trading | **Weekend/after-hours volume** stat: share of tokenized-MSTR volume traded while Nasdaq is closed | GeckoTerminal/DEX OHLCV, Hyperliquid candles |
| Weekly BTC holdings ("we hold 848,250 BTC") | **Holdings ticker plus a purchase step chart** (last update date, link to 8-K) | SEC EDGAR 8-Ks; strategy.com |
| USD reserve | Reserve (BTC + USD) card | 8-K |
| BTC per share / BTC Yield | **BTC per share** card and chart; on-chain angle: "BTC behind 1 token" | 8-K holdings ÷ shares (10-Q) |
| mNAV | **mNAV gauge**, defined like Strategy's, with the formula shown | price × shares ÷ net reserve; label it simplified |
| Annualized returns vs Mag 7 and asset classes | **"Since Aug 10 2020" returns strip**: MSTR, BTC, tokenized MSTR | price history (CoinGecko, Stooq) |
| STRC dividend rate | **STRC rate ticker**; STRC volatility vs MSTR | Strategy press releases |
| BTC as collateral / DeFi | **"Use as collateral"** table (Kamino, Teller, Aave/Morpho if they list) with LTV and APY | DefiLlama, protocol APIs (we have /api/defi) |
| Quote cards | Rotating **"In his words"** strip on /learn with dated, linked quotes (these 11 only) | this file |

Gaps: no transcript of the World Bank talk; X Articles bodies not fetched; no Saylor quote yet mentioning Robinhood Chain or $STRATEGY specifically (don't imply one).

## Vlad Tenev (Robinhood CEO) on Robinhood Chain and RWAs (verified on X, Oct 14, 2026)
- "Robinhood Chain exists to make real world assets programmable, globally portable, and always available, with the product quality you've come to expect from Robinhood." 2026-07-16. https://x.com/vladtenev/status/2077814433762451646 (used on site)
- "Robinhood Chain is built for tokenized real-world assets and the apps people actually want to use with them. Usage follows utility: …" 2026-10-12 (reply). https://x.com/vladtenev/status/2109700037861310828
- "While we're building robinhood chain to be the best chain for RWA … it works great for memes too" 2026-07-08. https://x.com/vladtenev/status/2074695821896065360
- "The future of crypto is in real-world assets." 2026-07-08. https://x.com/vladtenev/status/2074646246476890610

None of these uses the exact phrase "home of RWAs".

## Base volume check (Oct 14, 2026, around 10:45 CT)
- **Pool:** MSTRc/USDC on Aerodrome Slipstream, Base pool 0x8b27f626ab668197000bc722a1012022caed10e2.
- **Base token:** 0xb2000000000000000000004884b426556b92883d. DexScreener names it "Strategy Inc." (MSTRc), the Coinbase-tokenized MSTR. This is the same as the CoinGecko listing.
- **24h volume:** $17.02M (GeckoTerminal), $17.10M (DexScreener); all 17 pairs total $17.20M. CoinGecko shows $16.42M for the token.
- **Size relative to the market:** CoinGecko market cap is only $2.27M, and pool liquidity is about $2.15M, so the pool turned over about 8× in a day.
- **Trades:** 8,953 trades from 454 buyers and 387 sellers.
- **Concentration:** in the last 300 trades (about 40 minutes), one address (0x80e4e365…dcc58) made 131 trades and about 57–59% of the USD volume, buying and selling within seconds. It's an externally owned account with about 184.9K lifetime transactions.
- **Verdict:** the volume is real on-chain trading, but it is mostly one automated trader. It is not broad usage.
- **Robinhood Chain cross-check:**
  - DexScreener: 30 pairs, $4.37M, 7,603 trades.
  - GeckoTerminal: 60 pools, $4.28M; token total $4.29M.
  - CoinGecko: $4.18M.
  - Top trader is 16% of the recent sample.
