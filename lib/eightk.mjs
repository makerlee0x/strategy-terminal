// 8-K day: what the latest Strategy₿ Inc. BTC 8-K changed: BTC → MSTR (amplified BTC) → $STRATEGY (amplified MSTR). Used by the homepage banner, /8k and the card image.
export const EIGHT_K_HOURS = 72;
/** F8 = /api/strategy-filings payload; per1M = MSTR per 1M $STRATEGY (pool MSTR / 1e3). */
export function eightK(F8, per1M) {
  const L = F8?.latest; if (!L) return null;
  const change = F8.weeklyChangeBtc;
  return { filingDate: L.filingDate, asOf: L.asOf, prevAsOf: F8.previous?.asOf || null, doc: L.doc, btcHeld: L.btcHeld, change, per1M };
}
/** True within EIGHT_K_HOURS of the filing date (EDGAR dates are US Eastern; noon ET is a safe midpoint). */
export const isFresh = (k, now = Date.now()) => !!k?.filingDate && now - Date.parse(k.filingDate + 'T12:00:00-04:00') < EIGHT_K_HOURS * 3600e3;
/** Headline verb for the change. */
export const headline = k => k?.change > 0 ? `SAYLOR BOUGHT ${k.change.toLocaleString('en-US')} BTC.` : k?.change < 0 ? `STRATEGY₿ INC. SOLD ${(-k.change).toLocaleString('en-US')} BTC.` : 'NO NEW BTC THIS FILING.';
export const signed = (v, d = 0) => v == null ? '—' : (v >= 0 ? '+' : '−') + Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: d });
