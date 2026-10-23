import { preflight, cachedFetch, lastGood, json, getJson } from '../../../lib/guard';
import cg from '../../../data/coingecko-tokens.json';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
// Per-chain activity for tokenized MSTR: 24h DEX volume + DEX liquidity (GeckoTerminal token totals).
const NET = { robinhood: ['robinhood', 'Robinhood Chain'], solana: ['solana', 'Solana'], 'arbitrum-one': ['arbitrum', 'Arbitrum'], ethereum: ['eth', 'Ethereum'], 'binance-smart-chain': ['bsc', 'BNB Chain'], avalanche: ['avax', 'Avalanche'], hyperevm: ['hyperevm', 'HyperEVM'], 'morph-l2': ['morph-l2', 'Morph'], mantle: ['mantle', 'Mantle'] };
// Tokens not in the CoinGecko list: Mantle WMSTRX (DefiLlama fluxion pool underlying). Base is intentionally not part of this comparison.
const EXTRA = { mantle: ['0x266e5923f6118f8b340ca5a23ae7f71897361476'] };
const sleep = ms => new Promise(r => setTimeout(r, ms));
// One GeckoTerminal call per chain, all at once, so the whole load fits well inside a serverless time limit.
async function one(p, addrs) {
  const [gt, label] = NET[p];
  const url = `https://api.geckoterminal.com/api/v2/networks/${gt}/tokens/multi/${[...new Set(addrs)].join(',')}`; let d;
  for (let i = 0; ; i++) { try { d = await getJson(url, { ms: 8000 }); break; } catch (e) { if (i >= 1) return { key: p, chain: label, error: true }; await sleep(1500); } }
  const vol = d.data.reduce((s, x) => s + (+x.attributes.volume_usd?.h24 || 0), 0), liq = d.data.reduce((s, x) => s + (+x.attributes.total_reserve_in_usd || 0), 0);
  const top = d.data.flatMap(x => x.relationships?.top_pools?.data || []).map(x => x.id)[0] || null;
  return { key: p, chain: label, vol24Usd: vol, dexLiquidityUsd: liq, topPool: top, tokens: d.data.map(x => x.attributes.symbol) };
}
async function load() {
  const by = {};
  for (const t of cg.tokens) for (const [p, a] of Object.entries(t.platforms || {})) if (NET[p]) (by[p] ||= []).push(a);
  for (const [p, a] of Object.entries(EXTRA)) (by[p] ||= []).push(...a);
  const chains = await Promise.all(Object.entries(by).map(([p, a]) => one(p, a)));
  if (chains.every(c => c.error)) throw new Error('all_failed');
  chains.sort((a, b) => (b.vol24Usd ?? -1) - (a.vol24Usd ?? -1));
  const totVol = chains.reduce((s, c) => s + (c.vol24Usd || 0), 0);
  chains.forEach((c, i) => { c.rank = c.vol24Usd != null ? i + 1 : null; c.volSharePct = totVol && c.vol24Usd != null ? c.vol24Usd / totVol * 100 : null; });
  return { ok: true, fetchedAt: new Date().toISOString(), source: 'geckoterminal', totalDexVol24Usd: totVol, chains,
    note: 'Volume and DEX liquidity: GeckoTerminal 24h totals for each tokenized-MSTR contract on that chain.' };
}
export async function OPTIONS(req) { return preflight(req); }
export async function GET(req) {
  const pf = preflight(req, { browser: { limit: 30 }, anon: { limit: 10 }, prefix: 'chains' }); if (pf) return pf;
  const origin = req.headers.get('origin') || '';
  try { const { value } = await cachedFetch('chains', 600_000, load); return json(value, { origin, sMaxAge: 300, swr: 3600 }); }
  catch (e) { const lg = lastGood('chains'); return json(lg ? { ...lg.value, ok: false, delayed: true } : { ok: false, delayed: true, chains: [] }, { origin, sMaxAge: 30 }); }
}
