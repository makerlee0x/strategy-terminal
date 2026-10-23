import { ImageResponse } from 'next/og';
import { preflight } from '../../../../lib/guard';
import { C, fonts, markSrc, num, cacheHeaders, cardData } from '../../../../lib/og';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
// 1200×675 "Share of MSTR" share image (design D): 1 in N Robinhood MSTR sits in the $STRATEGY pool. ?demo=1 for sample data.
export async function GET(req) {
  const pf = preflight(req, { browser: { limit: 30 }, anon: { limit: 30 }, prefix: 'card' }); if (pf) return pf;
  const demo = new URL(req.url).searchParams.get('demo') === '1';
  const k = await cardData(demo);
  if (k.pool == null || !k.supply) return new Response('Supply data unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  const F = await fonts(), D = { fontFamily: 'Bungee' }, M = { fontFamily: 'Space Mono', fontWeight: 700 };
  const n = Math.round(k.supply / k.pool), shown = Math.min(n, 60);
  return new ImageResponse(
    <div style={{ width: 1200, height: 675, display: 'flex', flexDirection: 'column', padding: '56px 64px', background: C.red, color: '#fff', ...M }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 20, letterSpacing: 1 }}>{'THE $STRATEGY POOL HOLDS' + (k.demo ? ' · SAMPLE' : '')}</span><img src={markSrc('#ffffff')} width={64} height={44} /></div>
      <div style={{ ...D, fontSize: 200, lineHeight: 0.95, marginTop: 20 }}>{'1 IN ' + n}</div>
      <div style={{ fontSize: 28, marginTop: -14 }}>of every MSTR token on Robinhood Chain</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', width: 740, marginTop: 30 }}>
        {Array.from({ length: shown }, (_, i) => <div key={i} style={{ width: 26, height: 26, borderRadius: 13, marginRight: 22, marginBottom: 14, display: 'flex', ...(i ? { border: '3px solid rgba(255,255,255,.45)' } : { background: '#fff', boxShadow: '0 0 22px #fff' }) }} />)}</div>
      <div style={{ display: 'flex', flexGrow: 1 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}><span>{`${num(k.pool)} of ${num(k.supply)} MSTR · ${(k.pool / k.supply * 100).toFixed(2)}%`}</span><span>strategycoin.io</span></div>
    </div>,
    { width: 1200, height: 675, fonts: F.length ? F : undefined, headers: cacheHeaders(demo) });
}
