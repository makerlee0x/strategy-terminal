import { getJson, getText } from './guard';
// SEC EDGAR: latest Strategy₿ Inc. (CIK 1050446) 8-K BTC update + 10-Q/10-K cover share count.
const CIK = '1050446';
const UA = () => ({ 'User-Agent': process.env.SEC_USER_AGENT || 'strategycoin.io MSTR hub https://strategycoin.io', Accept: '*/*' });
const plain = h => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, "'").replace(/&#[0-9]+;|&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
const toNum = s => +String(s).replace(/,/g, '');
const unit = (v, u) => toNum(v) * (/^b/i.test(u) ? 1e9 : 1e6);
const docUrl = (acc, name) => `https://www.sec.gov/Archives/edgar/data/${CIK}/${acc.replace(/-/g, '')}/${name}`;

function parseBtc(t) {
  if (!/Aggregate BTC Holdings/i.test(t)) return null;
  const re = /(\d{1,3}(?:,\d{3})+)\s*\$\s?([\d.]+)\s*\$\s?([\d,.]+)/g; let m, last = null;
  while ((m = re.exec(t))) if (toNum(m[1]) >= 100000) last = m;
  if (!last) return null;
  const before = t.slice(0, last.index); const dates = [...before.matchAll(/As of ([A-Z][a-z]+ \d{1,2}, \d{4})/g)];
  const usd = t.match(/balances of the USD Reserve and USD Cash were \$\s?([\d.,]+) (billion|million) and \$\s?([\d.,]+) (billion|million)/i);
  return { btcHeld: toNum(last[1]), totalCostUsd: toNum(last[2]) * 1e9, avgCostUsd: toNum(last[3]), asOf: dates.length ? dates[dates.length - 1][1] : null,
    usdReserve: usd ? unit(usd[1], usd[2]) : null, usdCash: usd ? unit(usd[3], usd[4]) : null };
}
async function parseFiling(acc, primary) {
  const idx = await getJson(docUrl(acc, 'index.json'), { headers: UA() });
  const docs = idx.directory.item.map(i => i.name).filter(n => /\.htm$/i.test(n) && !/index/i.test(n));
  docs.sort((a, b) => (/ex99/i.test(b) ? 1 : 0) - (/ex99/i.test(a) ? 1 : 0) || (a === primary ? -1 : 1));
  for (const d of docs) { const p = parseBtc(plain(await getText(docUrl(acc, d), { headers: UA() }))); if (p) return { ...p, doc: docUrl(acc, d) }; }
  return null;
}
/** Latest two BTC 8-Ks plus the share count from the latest 10-Q/10-K. */
export async function loadFilings() {
  const sub = await getJson(`https://data.sec.gov/submissions/CIK${CIK.padStart(10, '0')}.json`, { headers: UA(), maxBytes: 10_000_000 });
  const r = sub.filings.recent, found = [];
  for (let i = 0; i < r.form.length && found.length < 2 && i < 60; i++) {
    if (r.form[i] !== '8-K') continue;
    const p = await parseFiling(r.accessionNumber[i], r.primaryDocument[i]).catch(() => null);
    if (p) found.push({ ...p, filingDate: r.filingDate[i], accession: r.accessionNumber[i], index: docUrl(r.accessionNumber[i], '') });
  }
  if (!found.length) throw new Error('no_btc_8k');
  let shares = null; const qi = r.form.findIndex(f => f === '10-Q' || f === '10-K');
  if (qi >= 0) {
    const u = docUrl(r.accessionNumber[qi], r.primaryDocument[qi]);
    const t = plain((await getText(u, { headers: UA(), maxBytes: 20_000_000 })).slice(0, 600_000));
    const m = t.match(/As of ([A-Z][a-z]+ \d{1,2}, \d{4}), the registrant had ([\d,]+) and ([\d,]+) shares of class A common stock and class B common stock outstanding/i);
    if (m) shares = { classA: toNum(m[2]), classB: toNum(m[3]), total: toNum(m[2]) + toNum(m[3]), asOf: m[1], form: r.form[qi], filingDate: r.filingDate[qi], url: u };
  }
  const [cur, prev] = found;
  const btcPerShare = shares ? cur.btcHeld / shares.total : null;
  return { ok: true, source: 'sec-edgar', fetchedAt: new Date().toISOString(), latest: cur, previous: prev || null,
    weeklyChangeBtc: prev ? cur.btcHeld - prev.btcHeld : null, shares, btcPerShare, satsPerShare: btcPerShare != null ? btcPerShare * 1e8 : null,
    formula: 'BTC per share = BTC held (latest 8-K) ÷ class A + class B shares (latest 10-Q/10-K cover)' };
}
