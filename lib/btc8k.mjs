// Parse the BTC update table out of a Strategy₿ Inc. 8-K (plain text, tags stripped). Pure, so it can be tested without network.
const toNum = s => +String(s).replace(/,/g, '');
const unit = (v, u) => toNum(v) * (/^b/i.test(u) ? 1e9 : 1e6);

export function parseBtc(t) {
  if (!/Aggregate BTC Holdings/i.test(t)) return null;
  const re = /(\d{1,3}(?:,\d{3})+)\s*\$\s?([\d.]+)\s*\$\s?([\d,.]+)/g; let m, last = null;
  while ((m = re.exec(t))) if (toNum(m[1]) >= 100000) last = m;
  if (!last) return null;
  const before = t.slice(0, last.index); const dates = [...before.matchAll(/As of ([A-Z][a-z]+ \d{1,2}, \d{4})/g)];
  // The period columns sit directly before the holdings columns in the same row: "811 $ 65.5 $ 80,846 849,327 $ 64.08 $ 75,451".
  // Use the filing's own "BTC Purchased" figure. Diffing two rounded holdings totals can be off by one (e.g. 849,327 − 848,517 = 810, filed as 811).
  const hdr = before.slice(Math.max(0, before.lastIndexOf('During Period')));
  const row = /BTC (Purchased|Acquired)/i.test(hdr) && before.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*\$\s?[\d.,]+\s*\$\s?[\d,.]+\s*$/);
  const period = before.match(/During Period ([A-Z][a-z]+ \d{1,2}, \d{4}) to ([A-Z][a-z]+ \d{1,2}, \d{4})(?![\s\S]*During Period)/);
  const usd = t.match(/balances of the USD Reserve and USD Cash were \$\s?([\d.,]+) (billion|million) and \$\s?([\d.,]+) (billion|million)/i);
  return { btcHeld: toNum(last[1]), totalCostUsd: toNum(last[2]) * 1e9, avgCostUsd: toNum(last[3]), asOf: dates.length ? dates[dates.length - 1][1] : null,
    btcPurchased: row ? toNum(row[1]) : null, periodFrom: period ? period[1] : null, periodTo: period ? period[2] : null,
    usdReserve: usd ? unit(usd[1], usd[2]) : null, usdCash: usd ? unit(usd[3], usd[4]) : null };
}
