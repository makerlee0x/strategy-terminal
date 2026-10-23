# STRATEGY pool backing model: how much MSTR sits in the pool vs market cap

Research only, no code changes. Data pulled Oct 14, 2026 (CT): DexScreener pairs API for reserves and prices, and Robinhood Chain RPC (`ModifyLiquidity` logs on Uniswap v4 PoolManager `0x8366…0951`) for the launch positions.

## Verdict
- **The square-root model holds.** Stock in the pool grows with √(market cap), not in a straight line.
- **It needs two corrections:**
  - a small offset, because the launch range starts at about a $20K market cap;
  - a fee uplift of +0–27% seen on the live pools.
- **Corrected formula** (MSTR held at today's ~$142.57):

  `MSTR_in_pool ≈ 0.9935 × (√mcap − √20,265) × f`

  Here `f` is about 1.14 today; f = 1 is the pure-curve floor.
- The old rule of thumb, 1,338·√(mcap/1.86M), lands within about 3% of the pure curve. It runs about 10% below the live reserve because it leaves out fees.
- **The backing ratio shrinks as market cap grows.** Pool MSTR is worth about 9% of mcap at $1.8M, about 1.4% at $100M and about 0.4% at $1B.

## LONG (long.xyz, Robinhood Chain) launch configuration, read from chain
Every coin checked has the same layout:
- 1B supply.
- Two **single-sided, token-only concentrated positions**, which meet at a common tick:
  - **Launch range:** about 110,440 ticks wide, which is a ×62,500 price span. It runs from about a $18–23K market cap to about a $1.1–1.4B market cap, valued at today's stock price.
  - **Tail range:** from the top of the launch range up to the maximum tick.
- Thousands of small **full-range** adds after launch. These are most likely fee compounding by the hook or launchpad; I have not confirmed that.

Other sources:
- Mobula's integration guide (docs.mobula.io/almanac/robinhood-launchpads/longxyz) says long.xyz uses Uniswap v4 concentrated liquidity, Airlock/Doppler style, with a time-based epoch rather than reserve-based bonding.
- Fee tier: long.supply documents fee = 0, tickSpacing 200, and a hook fee in the base token, but that is a different deployment, on Arc. **I could not confirm the fee for the Robinhood pools.**

| Coin | Pair | Launch range (ticks) | L (range) | Launch mcap* | Range top mcap* |
|---|---|---|---|---|---|
| STRATEGY | MSTR | −157,672 → −47,232 | 375,129 | $20.3K | $1.27B |
| AI | NVDA | −161,728 → −51,296 | 306,275 | $20.9K | $1.30B |
| BONER | HIMS | −142,408 → −31,976 | 804,672 | $18.2K | $1.14B |
| MEME | AMC (token is currency1, mirrored) | 117,448 → 7,016 | 2,802,794 | $23.2K | $1.45B |

\*In USD at today's stock price.

Inside the range, a token-only position holds stock = L·(√p − √p_launch), with p = stock per coin. Market cap = 1e9·p·S, where S is the USD price of the stock. That gives:

stock = L/√(1e9·S) · (√mcap − √mcap_launch)

This is a **√ curve**, not a linear one. It has the same shape as constant product, but its zero point sits at the launch price.

## Current data points (DexScreener, Oct 14, 2026)
| Coin | Mcap | Stock in pool | Coin left in pool | Curve-only model | Actual ÷ model | Stock $ ÷ mcap |
|---|---|---|---|---|---|---|
| STRATEGY | $1.83M | 1,373.2 MSTR | 122.9M (12.3%) | 1,203 MSTR | 1.14 | 10.7% |
| MEME | $10.8M | 206,462 AMC | 62.8M (6.3%) | 162,775 | 1.27 | 5.6% |
| BONER | $21.4M | 25,521 HIMS | 39.0M (3.9%) | 21,685 | 1.18 | 3.3% |
| AI | $96.6M | 6,359 NVDA | 20.2M (2.0%) | 6,359 | 1.00† | 1.45% |

†For AI I only scanned the launch window, so its later full-range adds are not counted. The real uplift is probably small at that size.

**Cross-check:** run at $100M, the STRATEGY curve gives 1.4% backing. AI's live pool shows 1.45% at $96.6M. Because the configurations are the same, the √ law carries over between coins once you correct for stock price.

**Why the backing looks "large" in AI/BONER/MEME:** it is large in absolute stock units. As a share of market cap it falls like 1/√mcap. That is the opposite of linear.

## STRATEGY estimates (MSTR at $142.57, f = 1.00 → 1.14)
| Mcap | MSTR in pool (curve) | With today's fee uplift | Old formula | STRATEGY left in pool | Backing % of mcap |
|---|---|---|---|---|---|
| $1.83M (now) | 1,203 | 1,372 | 1,328 | 110M | 9.4% |
| $5M | 2,080 | 2,371 | 2,194 | 68M | 5.9% |
| $10M | 3,000 | 3,420 | 3,102 | 50M | 4.3% |
| $50M | 6,884 | 7,847 | 6,937 | 25M | 2.0% |
| $100M | 9,794 | 11,165 | 9,811 | 19M | 1.4% |
| $1B | 31,276 | 35,654 | 31,024 | 9.5M | 0.4% |

Caveats:
- **These figures assume a fixed MSTR price.** The curve is really in MSTR terms, √(mcap measured in MSTR). If MSTR rises, the same USD market cap means less MSTR in the pool.
- **The fee uplift depends on volume.** It is not fixed.
- **Above about $1.27B the tail position takes over,** with L ≈ 848,524, so the slope gets steeper there.
- **No time-series fit.** I did not pull OHLCV history. The fit is cross-sectional across four coins, plus the exact on-chain curve.
