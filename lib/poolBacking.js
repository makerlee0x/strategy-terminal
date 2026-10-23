import { getJson } from './guard';
// Launch positions read from Uniswap v4 ModifyLiquidity logs (immutable, single-sided, token-only).
// stockInPool = L × (√p − √p_launch), p = stock per coin (both 18 decimals). See research/POOL-BACKING-MODEL.md.
const T = t => Math.pow(1.0001, t);
export const COINS = [
  { key: 'STRATEGY', stock: 'MSTR', pair: '0xa6975f4720a95aa9cdfa9b010a065b0e941534c93f9fa708104c08f0ac029ca0', tokenIs0: true, lo: -157672, hi: -47232, L: 375129.362198234609, L2: 848523.625770020674 },
];
export const SUPPLY = 1e9;
export async function poolBacking(c = COINS[0]) {
  const d = await getJson('https://api.dexscreener.com/latest/dex/pairs/robinhood/' + c.pair);
  const p = d.pairs?.[0]; if (!p) throw new Error('no pair');
  const coinIsBase = p.baseToken.symbol !== c.stock;
  const stockInPool = Number(coinIsBase ? p.liquidity?.quote : p.liquidity?.base), coinInPool = Number(coinIsBase ? p.liquidity?.base : p.liquidity?.quote);
  const priceUsd = Number(p.priceUsd), priceNative = Number(p.priceNative);
  const pStock = coinIsBase ? priceNative : 1 / priceNative; // stock per coin
  const stockUsd = coinIsBase ? priceUsd / priceNative : priceUsd; // DexScreener priceUsd is base's USD price
  const coinUsd = pStock * stockUsd, mcapUsd = coinUsd * SUPPLY;
  // launch price (stock per coin) and range top
  const pLaunch = c.tokenIs0 ? T(c.lo) : 1 / T(c.hi), pTop = c.tokenIs0 ? T(c.hi) : 1 / T(c.lo);
  const curve = c.L * (Math.sqrt(pStock) - Math.sqrt(pLaunch));
  return { key: c.key, stock: c.stock, pair: c.pair, url: 'https://dexscreener.com/robinhood/' + c.pair, L: c.L, L2: c.L2 || null, pLaunch, pTop,
    launchMcapStock: pLaunch * SUPPLY, rangeTopMcapStock: pTop * SUPPLY, stockUsd, coinUsd, mcapUsd, pStock,
    stockInPool, coinInPool, curveStock: curve, volume24hUsd: p.volume?.h24 != null ? Number(p.volume.h24) : null, f: curve > 0 ? stockInPool / curve : null, backingPct: mcapUsd ? stockInPool * stockUsd / mcapUsd * 100 : null };
}
