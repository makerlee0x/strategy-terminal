import { preflight, cachedFetch, json, getJson } from '../../../lib/guard';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
const HL = 'https://api.hyperliquid.xyz/info';
async function hyperliquid() {
  const dexs = (await getJson(HL, { method: 'POST', body: JSON.stringify({ type: 'perpDexs' }) })).filter(Boolean).map(d => d.name);
  const out = [];
  await Promise.all(dexs.map(async dex => { try { const [m, c] = await getJson(HL, { method: 'POST', body: JSON.stringify({ type: 'metaAndAssetCtxs', dex }) }); m.universe.forEach((u, i) => { if (/(^|:)MSTR$/i.test(u.name)) out.push({ venue: 'Hyperliquid', market: u.name, dex, vol24Usd: +c[i].dayNtlVlm, openInterest: +c[i].openInterest, oiUnit: 'MSTR', markPx: +c[i].markPx }); }); } catch (_) {} }));
  return out;
}
async function lighter() {
  const j = await getJson('https://mainnet.zklighter.elliot.ai/api/v1/orderBookDetails');
  return (j.order_book_details || []).filter(x => /^MSTR$/i.test(x.symbol)).map(x => ({ venue: 'Lighter', market: x.symbol, vol24Usd: +x.daily_quote_token_volume, openInterest: +x.open_interest, oiUnit: 'MSTR (assumed base units)', markPx: +x.last_trade_price }));
}
export async function OPTIONS(req) { return preflight(req); }
export async function GET(req) {
  const pf = preflight(req, { browser: { limit: 30 }, anon: { limit: 10 }, prefix: 'perps' }); if (pf) return pf;
  const origin = req.headers.get('origin') || '';
  const { value } = await cachedFetch('perps', 60_000, async () => {
    const [h, l] = await Promise.allSettled([hyperliquid(), lighter()]);
    const markets = [...(h.value || []), ...(l.value || [])];
    return { ok: markets.length > 0, fetchedAt: new Date().toISOString(), markets, totalVol24Usd: markets.reduce((a, m) => a + (m.vol24Usd || 0), 0), errors: { hyperliquid: h.status === 'rejected', lighter: l.status === 'rejected' } };
  });
  return json(value, { origin });
}
