import { preflight, cachedFetch, lastGood, json, getJson } from '../../../lib/guard';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
// Share of tokenized-MSTR volume traded while Nasdaq is closed.
// Regular session 09:30–16:00 America/New_York, Mon–Fri, excluding NYSE holidays (early closes at 13:00).
const HOLIDAYS = new Set(['2026-01-01','2026-01-19','2026-02-16','2026-04-03','2026-05-25','2026-06-19','2026-07-03','2026-09-07','2026-11-26','2026-12-25','2027-01-01','2027-01-18','2027-02-15','2027-03-26','2027-05-31','2027-06-18','2027-07-05','2027-09-06','2027-11-25','2027-12-24']);
const EARLY = new Set(['2026-11-27','2026-12-24','2027-11-26']);
const POOLS = [
  ['Robinhood MSTR / USDG', 'robinhood', '0x319bac87e616a89e241c10aeb8afd4892a852cdd8b373cd9765ecddc40b87cfe'],
  ['Robinhood MSTR / USDG (2)', 'robinhood', '0xc105b8300ff65d750a0e4e63c7a879e20504069b770713464a5315e797735326'],
  ['$STRATEGY / MSTR', 'robinhood', '0xa6975f4720a95aa9cdfa9b010a065b0e941534c93f9fa708104c08f0ac029ca0'],
  ['MSTRx / USDC (Solana)', 'solana', 'RyhF4cksVZY7vcqJpoytHcxcGNKRp27PEGhSnEPpbGv'],
  ['MSTRx / SOL (Solana)', 'solana', '2ngTuP7xA581dqX9uJkGRqxmKuehY3k4SDfPebeoRG2J'],
];
const fmtNY = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false });
/** Fraction of the hour starting at unix `ts` that falls inside the regular session (0..1). */
export function openFraction(ts) {
  const p = Object.fromEntries(fmtNY.formatToParts(new Date(ts * 1000)).map(x => [x.type, x.value]));
  const date = `${p.year}-${p.month}-${p.day}`; const h = +p.hour % 24 + (+p.minute) / 60;
  if (p.weekday === 'Sat' || p.weekday === 'Sun' || HOLIDAYS.has(date)) return 0;
  const open = 9.5, close = EARLY.has(date) ? 13 : 16;
  return Math.max(0, Math.min(h + 1, close) - Math.max(h, open));
}
function summarize(rows, days, now) {
  const from = now - days * 86400; let tot = 0, off = 0;
  for (const [ts, v] of rows) if (ts >= from) { tot += v; off += v * (1 - openFraction(ts)); }
  return { totalUsd: tot, closedUsd: off, closedPct: tot ? off / tot * 100 : null };
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function load() {
  const now = Math.floor(Date.now() / 1000), venues = [];
  for (const [name, net, id] of POOLS) {
    try {
      const d = await getJson(`https://api.geckoterminal.com/api/v2/networks/${net}/pools/${id}/ohlcv/hour?limit=720&currency=usd`, { ms: 15000 });
      const rows = d.data.attributes.ohlcv_list.map(c => [c[0], +c[5] || 0]);
      venues.push({ name, kind: 'spot', chain: net, d7: summarize(rows, 7, now), d30: summarize(rows, 30, now), rows });
    } catch (_) { venues.push({ name, kind: 'spot', chain: net, error: true }); }
    await sleep(400);
  }
  try {
    const c = await getJson('https://api.hyperliquid.xyz/info', { method: 'POST', body: JSON.stringify({ type: 'candleSnapshot', req: { coin: 'xyz:MSTR', interval: '1h', startTime: (now - 30 * 86400) * 1000 } }) });
    const rows = c.map(k => [Math.floor(k.t / 1000), (+k.v) * (+k.c)]);
    venues.push({ name: 'Hyperliquid xyz:MSTR perp', kind: 'perp', chain: 'hyperliquid', d7: summarize(rows, 7, now), d30: summarize(rows, 30, now), rows });
  } catch (_) { venues.push({ name: 'Hyperliquid xyz:MSTR perp', kind: 'perp', error: true }); }
  const agg = (kind, k) => { const v = venues.filter(x => !x.error && (!kind || x.kind === kind)); const t = v.reduce((a, x) => a + x[k].totalUsd, 0), o = v.reduce((a, x) => a + x[k].closedUsd, 0); return { totalUsd: t, closedUsd: o, closedPct: t ? o / t * 100 : null }; };
  // Share of calendar hours when Nasdaq is closed over the last 30 days (baseline).
  let hrs = 0, closedH = 0; for (let t = now - 30 * 86400; t < now; t += 3600) { hrs++; closedH += 1 - openFraction(t - (t % 3600)); }
  if (venues.every(v => v.error)) throw new Error('all_failed');
  return { ok: true, fetchedAt: new Date().toISOString(), source: 'geckoterminal + hyperliquid',
    spot: { d7: agg('spot', 'd7'), d30: agg('spot', 'd30') }, perp: { d7: agg('perp', 'd7'), d30: agg('perp', 'd30') }, all: { d7: agg(null, 'd7'), d30: agg(null, 'd30') },
    closedHoursPct30: closedH / hrs * 100,
    venues: venues.map(({ rows, ...v }) => v),
    method: 'Hourly USD volume per venue. Each hour is weighted by the fraction of it inside the Nasdaq regular session (09:30–16:00 ET, Mon–Fri, NYSE holidays and 13:00 early closes). Closed share = volume outside the session ÷ total. Spot = DEX pools (GeckoTerminal); perp = Hyperliquid xyz:MSTR (base volume × hourly close).' };
}
export async function OPTIONS(req) { return preflight(req); }
export async function GET(req) {
  const pf = preflight(req, { browser: { limit: 30 }, anon: { limit: 10 }, prefix: 'offhours' }); if (pf) return pf;
  const origin = req.headers.get('origin') || '';
  try { const { value } = await cachedFetch('offhours', 1_800_000, load); return json(value, { origin, sMaxAge: 900 }); }
  catch (e) { const lg = lastGood('offhours'); return json(lg ? { ...lg.value, ok: false, delayed: true } : { ok: false, delayed: true }, { origin, sMaxAge: 30 }); }
}
