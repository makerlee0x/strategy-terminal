import { ImageResponse } from 'next/og';
import { preflight } from '../../../../lib/guard';
import { C, fonts, markSrc, today, num, cacheHeaders, cardData } from '../../../../lib/og';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
// 1200×675 "Flex your stack" share image (design A): MSTR per 1M $STRATEGY, big, on oxblood. ?demo=1 for sample data.
export async function GET(req) {
  const pf = preflight(req, { browser: { limit: 30 }, anon: { limit: 30 }, prefix: 'card' }); if (pf) return pf;
  const demo = new URL(req.url).searchParams.get('demo') === '1';
  const k = await cardData(demo);
  if (k.pool == null) return new Response('Pool data unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  const F = await fonts(), D = { fontFamily: 'Bungee' }, M = { fontFamily: 'Space Mono', fontWeight: 700 };
  const n = k.supply ? Math.round(k.supply / k.pool) : null;
  const stat = (label, v) => <div style={{ display: 'flex', flexDirection: 'column', marginRight: 56 }}><div style={{ fontSize: 16, color: C.mu, letterSpacing: 1 }}>{label}</div><div style={{ ...D, fontSize: 44, marginTop: 6 }}>{v}</div></div>;
  return new ImageResponse(
    <div style={{ width: 1200, height: 675, display: 'flex', flexDirection: 'column', padding: '56px 64px', background: C.bg, color: C.ink, ...M }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}><img src={markSrc(C.red)} width={54} height={37} /><span style={{ ...D, fontSize: 26, marginLeft: 14 }}>STRATEGY COIN</span></div>
        <span style={{ fontSize: 16, color: C.mu, letterSpacing: 1 }}>{today()}{k.demo ? ' · SAMPLE' : ''}</span></div>
      <div style={{ ...D, fontSize: 230, lineHeight: 0.9, color: C.redT, marginTop: 34 }}>{(k.pool / 1e3).toFixed(2)}</div>
      <div style={{ fontSize: 28, marginTop: -18, letterSpacing: 1 }}>MSTR IN THE POOL FOR EVERY 1M $STRATEGY</div>
      <div style={{ display: 'flex', flexGrow: 1 }} />
      <div style={{ display: 'flex', alignItems: 'flex-end', borderTop: '3px solid rgba(243,230,220,.2)', paddingTop: 22 }}>
        {stat('MSTR IN POOL', num(k.pool))}{n ? stat('OF ROBINHOOD MSTR', '1 IN ' + n) : null}{k.holders ? stat('HOLDERS', k.holders) : null}
        <div style={{ display: 'flex', flexGrow: 1 }} /><span style={{ fontSize: 18 }}>strategycoin.io</span></div>
    </div>,
    { width: 1200, height: 675, fonts: F.length ? F : undefined, headers: cacheHeaders(demo) });
}
