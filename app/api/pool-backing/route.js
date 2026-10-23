import { preflight, cachedFetch, lastGood, json } from '../../../lib/guard';
import { COINS, SUPPLY, poolBacking } from '../../../lib/poolBacking';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export async function OPTIONS(req) { return preflight(req); }
export async function GET(req) {
  const pf = preflight(req, { browser: { limit: 30 }, anon: { limit: 10 }, prefix: 'poolbacking' }); if (pf) return pf;
  const origin = req.headers.get('origin') || '';
  try {
    const { value, cache } = await cachedFetch('poolbacking', 90_000, async () => {
      const rs = await Promise.allSettled(COINS.map(c => poolBacking(c)));
      const coins = rs.map((r, i) => r.status === 'fulfilled' ? r.value : { key: COINS[i].key, stock: COINS[i].stock, error: true });
      if (coins[0].error) throw new Error('strategy pair unavailable');
      return { ok: true, source: 'dexscreener + onchain launch ranges', supply: SUPPLY, fetchedAt: new Date().toISOString(), strategy: coins[0] };
    });
    return json(value, { origin, sMaxAge: 60, swr: 300, headers: { 'X-Cache': cache } });
  } catch (_) {
    const lg = lastGood('poolbacking');
    if (lg) return json({ ...lg.value, delayed: true }, { origin, sMaxAge: 15, headers: { 'X-Cache': 'STALE' } });
    return json({ ok: false, delayed: true }, { origin, sMaxAge: 15, headers: { 'X-Cache': 'DELAYED' } });
  }
}
