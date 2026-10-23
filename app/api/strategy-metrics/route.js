import { preflight, cachedFetch, lastGood, json, getJson } from '../../../lib/guard';
import { parseDisplay } from '../../../lib/parse';
export const dynamic = 'force-dynamic';
const UPSTREAM = process.env.STRATEGY_METRICS_URL || 'https://stocktokenswap.com/api/strategy-metrics';
const KEYS = ['priceUsd','change24h','change24hPositive','change1h','change6h','priceMstr','marketCap','fdv','totalSupply','strategySupply','liquidityUsd','mstrInLp','mstrTokenized','mstrInLpPct','volume24h','trades24h','holders','pairAsset','sourceTime','asOf'];
const NUMERIC = ['priceUsd','change24h','change1h','change6h','priceMstr','marketCap','fdv','totalSupply','strategySupply','liquidityUsd','mstrInLp','mstrTokenized','mstrInLpPct','volume24h','trades24h','holders'];
const clean = (v, max = 64) => (typeof v === 'boolean' ? v : v == null ? null : String(v).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max) || null);
function pick(src) {
  const display = {}; for (const k of KEYS) if (k in src) { const c = clean(src[k]); if (c != null) display[k] = c; }
  if (!display.totalSupply && display.strategySupply) display.totalSupply = display.strategySupply;
  if (!display.strategySupply && display.totalSupply) display.strategySupply = display.totalSupply;
  const raw = {}; for (const k of NUMERIC) if (display[k] != null) raw[k] = parseDisplay(display[k]);
  return { display, raw };
}
export async function OPTIONS(req) { return preflight(req); }
export async function GET(req) {
  const pf = preflight(req, { browser: { limit: 40 }, anon: { limit: 12 }, prefix: 'metrics' }); if (pf) return pf;
  const origin = req.headers.get('origin') || '';
  if (process.env.STRATEGY_METRICS_URL && !/^https:/.test(process.env.STRATEGY_METRICS_URL)) return json({ ok: false, error: 'insecure_upstream' }, { status: 500, origin });
  try {
    const { value, cache } = await cachedFetch('strategy-metrics', 45_000, async () => {
      const d = await getJson(UPSTREAM, { headers: { Origin: 'https://www.strategycoin.io' } });
      const p = pick(d && typeof d === 'object' ? d : {});
      if (!p.display.priceUsd && !p.display.marketCap) throw new Error('empty');
      return { ok: true, delayed: false, source: clean(d.source, 32) || 'stocktokenswap', fetchedAt: new Date().toISOString(), ...p };
    });
    return json(value, { origin, headers: { 'X-Cache': cache } });
  } catch (_) {
    const lg = lastGood('strategy-metrics');
    // No fake-current numbers: return last good (marked delayed) or an empty delayed state.
    return json(lg ? { ...lg.value, ok: false, delayed: true, lastGoodAt: new Date(lg.at).toISOString() } : { ok: false, delayed: true, display: {}, raw: {} }, { origin, sMaxAge: 15, headers: { 'X-Cache': 'DELAYED' } });
  }
}
