import { preflight, cachedFetch, json, getJson } from '../../../lib/guard';
export const dynamic = 'force-dynamic';
const STRATEGY = '0x168661c52e5922288dfb2b3f323b6cf90eb21e18', PRIMARY = '0xa6975f4720a95aa9cdfa9b010a065b0e941534c93f9fa708104c08f0ac029ca0';
const GT = `https://api.geckoterminal.com/api/v2/networks/robinhood/tokens/${STRATEGY}/pools?page=1`;
const titleDex = id => String(id || 'Pool').replace(/-robinhood$/, '').split('-').map(p => p ? p[0].toUpperCase() + p.slice(1) : p).join('-');
export async function OPTIONS(req) { return preflight(req); }
export async function GET(req) {
  const pf = preflight(req, { browser: { limit: 30 }, anon: { limit: 10 }, prefix: 'pools' }); if (pf) return pf;
  const origin = req.headers.get('origin') || '';
  try {
    const { value, cache } = await cachedFetch('pools:strategy', 60_000, async () => {
      const raw = await getJson(GT);
      const pools = (raw.data || []).slice(0, 12).map(p => { const a = p.attributes || {}; const addr = String(a.address || '').toLowerCase();
        return { id: addr, dex: titleDex(p.relationships?.dex?.data?.id), pair: String(a.name || '').slice(0, 80), primary: addr === PRIMARY, liquidityUsd: Number(a.reserve_in_usd) || 0, volume24hUsd: Number(a.volume_usd?.h24) || 0, fee: (String(a.name).match(/(\d+(?:\.\d+)?)\s*%/) || [])[1] || null, url: 'https://www.geckoterminal.com/robinhood/pools/' + addr }; }).filter(p => p.id);
      pools.sort((a, b) => (b.primary - a.primary) || (b.liquidityUsd - a.liquidityUsd));
      return { ok: true, pairLabel: '$STRATEGY / MSTR', source: 'geckoterminal', fetchedAt: new Date().toISOString(), pools };
    });
    return json(value, { origin, swr: 120, headers: { 'X-Cache': cache } });
  } catch (_) { return json({ ok: false, delayed: true, source: 'geckoterminal', pools: [] }, { origin, sMaxAge: 15, headers: { 'X-Cache': 'DELAYED' } }); }
}
