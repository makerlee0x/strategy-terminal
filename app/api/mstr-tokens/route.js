import { preflight, cachedFetch, lastGood, json, getJson } from '../../../lib/guard';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
const TOKENS = { 'microstrategy-xstock': 'xStocks (Backed)', 'strategy-tokenized-bstocks': 'bStocks', 'microstrategy-ondo-tokenized-stock': 'Ondo', 'microstrategy-rstock': 'Reality', 'strategy-inc-robinhood-tokenized-stock': 'Robinhood', 'microstrategy-coinbase-tokenized-stock': 'Coinbase', 'strategy-dinari-tokenized-stock': 'Dinari', 'strategy-backpack-securities': 'Backpack', 'microstrategy-incorporated-st0x': 'ST0x' };
const SHARES_BASIS = Number(process.env.MSTR_SHARES_BASIS || 352534000); // SEC 10-Q Q2-2026 weighted basic; override via env
function cgUrl() {
  const key = process.env.COINGECKO_API_KEY, pro = key && process.env.COINGECKO_PLAN !== 'demo';
  const base = pro ? 'https://pro-api.coingecko.com/api/v3' : 'https://api.coingecko.com/api/v3';
  return { url: `${base}/coins/markets?vs_currency=usd&ids=${Object.keys(TOKENS).join(',')}`, headers: key ? { [pro ? 'x-cg-pro-api-key' : 'x-cg-demo-api-key']: key } : {} };
}
export async function OPTIONS(req) { return preflight(req); }
export async function GET(req) {
  const pf = preflight(req, { browser: { limit: 40 }, anon: { limit: 12 }, prefix: 'mstr' }); if (pf) return pf;
  const origin = req.headers.get('origin') || '';
  try {
    const { value, cache } = await cachedFetch('mstr-tokens', 300_000, async () => {
      const { url, headers } = cgUrl(); const d = await getJson(url, { headers });
      const tokens = d.map(c => ({ id: c.id, issuer: TOKENS[c.id], symbol: c.symbol, price: c.current_price, mcap: c.market_cap, vol24: c.total_volume, circ: c.circulating_supply, change24h: c.price_change_percentage_24h })).sort((a, b) => b.circ - a.circ);
      const sum = k => tokens.reduce((a, t) => a + (Number(t[k]) || 0), 0);
      const mcap = sum('mcap'), vol24 = sum('vol24'), circ = sum('circ');
      return { ok: true, source: 'coingecko', fetchedAt: new Date().toISOString(), tokens, totals: { mcap, vol24, circ, volPctMcap: mcap ? vol24 / mcap * 100 : null, pctShares: circ / SHARES_BASIS * 100, sharesBasis: SHARES_BASIS } };
    });
    return json(value, { origin, sMaxAge: 120, headers: { 'X-Cache': cache } });
  } catch (_) { const lg = lastGood('mstr-tokens'); return json(lg ? { ...lg.value, ok: false, delayed: true, lastGoodAt: new Date(lg.at).toISOString() } : { ok: false, delayed: true, tokens: [], totals: null }, { origin, sMaxAge: 15 }); }
}
