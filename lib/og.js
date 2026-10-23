// Shared pieces for the 1200×675 share images (next/og): brand colors, fonts, the logo and the mark.
import { MARK_D } from '../app/mark';
export const C = { bg: '#1c0809', panel: '#3a1416', ink: '#f3e6dc', mu: '#c7aaa3', red: '#d9232e', redT: '#ff5a63' };
async function font(family, weight = 400) {
  // Without a browser User-Agent, Google Fonts serves TTF, which the image renderer can read.
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`, { signal: AbortSignal.timeout(5000) })).text();
  const url = css.match(/src: url\((.+?)\)/)?.[1]; if (!url) throw new Error('font');
  return (await fetch(url, { signal: AbortSignal.timeout(5000) })).arrayBuffer();
}
export async function fonts() {
  const r = await Promise.allSettled([font('Bungee'), font('Space+Mono', 700)]);
  return [r[0].status === 'fulfilled' && { name: 'Bungee', data: r[0].value, weight: 400 }, r[1].status === 'fulfilled' && { name: 'Space Mono', data: r[1].value, weight: 700 }].filter(Boolean);
}
export async function logo(req) {
  try { const svg = await (await fetch(new URL('/strategy-logo.svg', req.url), { signal: AbortSignal.timeout(4000) })).text(); return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'); } catch (_) { return null; }
}
/** The mark as an <img> source, in any color. Aspect 550:381. */
export const markSrc = fill => 'data:image/svg+xml;base64,' + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 550 381"><path fill="${fill}" fill-rule="evenodd" d="${MARK_D}"/></svg>`).toString('base64');
export const today = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }).toUpperCase();
export const num = v => v == null ? '—' : Math.round(v).toLocaleString('en-US');
/** next/og sets its own year-long immutable Cache-Control and appends ours to it; replace it outright so cards stay fresh. */
export function withHeaders(res, headers) { for (const [k, v] of Object.entries(headers)) res.headers.set(k, v); return res; }
export const cacheHeaders = demo => ({ 'Cache-Control': demo ? 'no-store' : 'public, max-age=0, s-maxage=900, stale-while-revalidate=3600' });
/** Live numbers for the cards: pool MSTR, per 1M, Robinhood MSTR supply, 1 in N, holders. */
export async function cardData(demo) {
  if (demo) return { pool: 1472, supply: 43068, holders: '2,846', demo: true };
  const { initial } = await import('./ssr');
  const d = await initial(['/api/pool-backing', '/api/robinhood-mstr', '/api/strategy-metrics']);
  const s = d['/api/pool-backing']?.strategy;
  return { pool: s && !s.error ? s.stockInPool : null, supply: d['/api/robinhood-mstr']?.supply ?? null, holders: d['/api/strategy-metrics']?.display?.holders ?? null };
}
