// STRATEGY metrics: daily records, the fee-driven MSTR Yield, and placeholder history.
// Fee MSTR = MSTR in the pool above what the launch curve alone would hold at today's price
// (research/POOL-BACKING-MODEL.md). Demand-driven MSTR (the curve) is not counted as yield.
const day = d => d.toISOString().slice(0, 10);

/** One daily record from a /api/pool-backing `strategy` object. treasuryMstr stays null until a treasury wallet exists. */
export function record(s, date = new Date()) {
  return { d: day(date), poolMstr: s.stockInPool, curveMstr: s.curveStock, feeMstr: Math.max(0, s.stockInPool - s.curveStock), treasuryMstr: null, mcapUsd: s.mcapUsd, mstrUsd: s.stockUsd, supply: 1e9, volUsd: s.volume24hUsd ?? null };
}
export const holdings = r => r.poolMstr + (r.treasuryMstr || 0);
export const feeTotal = r => r.feeMstr + (r.treasuryMstr || 0);

/** MSTR Yield (fees) between two records: fee-driven MSTR added ÷ MSTR holdings at the start. */
export const mstrYield = (a, b) => a && b && holdings(a) > 0 ? (feeTotal(b) - feeTotal(a)) / holdings(a) * 100 : null;

/** Headline numbers from a sorted list of daily records (last = latest). yield30d stays null until 30 days are stored. */
export function summarize(days) {
  const L = days[days.length - 1]; if (!L) return null;
  const on = d => days.find(r => r.d >= d) || null;
  const t = new Date(L.d + 'T00:00:00Z'), y = t.getUTCFullYear();
  const ago = new Date(t); ago.setUTCDate(ago.getUTCDate() - 30);
  const h = holdings(L);
  return { asOf: L.d, holdings: h, per1M: h / L.supply * 1e6, feeMstr: feeTotal(L), feePer1M: feeTotal(L) / L.supply * 1e6, treasuryMstr: L.treasuryMstr,
    mnav: L.mcapUsd && L.mstrUsd ? L.mcapUsd / (h * L.mstrUsd) : null,
    yield30d: days[0].d <= day(ago) ? mstrYield(on(day(ago)), L) : null, yieldYtd: mstrYield(on(`${y}-01-01`), L), ytdFrom: days[0].d > `${y}-01-01` ? days[0].d : null };
}
