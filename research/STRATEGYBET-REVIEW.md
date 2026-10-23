# thestrategybet.com review (Oct 14, 2026)

This is an independent shareholder's site: "All-in on MSTR. Grounded in data." Reviewed from the public homepage text. Some numbers load client-side, so the tables were empty in the fetch.

## Sections
1. **Portfolio / Ledger:** the user enters their MSTR buys and sells. It shows value at the live quote, net cash invested, gain/loss and period returns, and explains its cash-flow-ratio method (not time-weighted, no tax basis).
2. **Retire with Strategy:** a planner that funds income from MSTR for growth plus preferreds (STRC, STRF, STRD) for income. Inputs include monthly contributions ($0–1,000). Output tables show actions, annual income, principal and preferred income. The assumptions are spelled out: a 20% MSTR floor, 30 years, yields easing toward STRC 8% / STRF 10% / STRD 12%, and a "Distressed" scenario.
3. **MSTR Calculator:** a projection from the latest 8-K (848,250 BTC on Oct 12, 2026). Sliders and scenarios:
   - BTC growth on a power-law fair-value line with a 4-year smoothstep
   - mNAV target (net-reserve definition, per Strategy's Jul 23, 2026 definition)
   - BTC accumulation on a logistic curve capped at 21M, with linked dilution
   - senior claims as % of BTC reserve (default 20%)
   - Output: a year-by-year table. Every formula is documented in info tooltips.
4. **Strategy Filings Dashboard:**
   - **BTC held:** 848,250, cost $64.00B, average $75,444.
   - **Changes:** week, quarter and year deltas.
   - **Reserve:** BTC + USD = $75.54B.
   - **USD:** reserve + cash = $5.52B.
5. **Common shareholder exposure:**
   - Senior claims $20.48B (debt $6.71B + preferred $13.76B); net reserve $55.06B.
   - Live mNAV.
   - Explanation that shareholders own equity, not BTC.
6. **Charts:** yearly reserve split into BTC and USD stacks; yearly ATM proceeds, debt, buybacks and dividends shown as a diverging bar chart.
7. **Capacity:** remaining ATM program capacity and how much was used last week.
8. **Filings table:** period, BTC held, ATM proceeds, debt raised, buybacks, debt repurchased, dividends, USD reserve, USD cash, and a link to each filing (EDGAR CIK 0001050446).

## What shareholders care about
- **Strategy's numbers:** BTC per share, the net-of-claims reserve, and mNAV.
- **Funding:** dilution and ATM usage, how much capacity remains, and debt and preferred claims (the risk).
- **Their own position:** their returns, and income from the preferreds (retirement planning).
- **Transparency:** every figure traced to a filing, and the formulas shown.

## What we should adapt (our style, our angle: tokenized MSTR)
| Rank | Element | Our version | Data |
|---|---|---|---|
| 1 | Filings snapshot | "Latest 8-K" record card: BTC held, week change, USD reserve, filing link | EDGAR full-text / submissions JSON (`data.sec.gov/submissions/CIK0001050446.json`), parsed weekly |
| 2 | mNAV, net reserve | One stamped mNAV figure with the formula and "simplified" label; also the on-chain token premium/discount vs Nasdaq MSTR | 8-K plus price feeds; CoinGecko token prices |
| 3 | BTC per token | "Each MSTR token ≈ X sats of Strategy BTC" (net of claims) — our unique tokenized angle | holdings ÷ shares |
| 4 | Simple calculator | "What if" with 3 sliders (BTC price, mNAV, years), far simpler than theirs, keeping our strategy.com-level simplicity | same as above |
| 5 | Diverging capital chart | ATM / preferred issuance vs BTC bought, yearly, in red/black | 8-K |
| 6 | Ledger | Skip (portfolio tracking is out of scope); maybe later "connect wallet to see your tokenized MSTR across chains" | RPC balances |
| 7 | Retirement / preferred income | Skip for now; at most an STRC/STRF/STRD rate strip linking to Strategy | press releases |

Don't copy their text, formulas wording or layout; cite Strategy filings directly. Their model choices (power law, logistic accumulation) are opinionated — if we do a calculator, keep assumptions explicit and minimal.
