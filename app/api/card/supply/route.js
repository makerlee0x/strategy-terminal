import { ImageResponse } from 'next/og';
import { preflight } from '../../../../lib/guard';
import { C, fonts, markSrc, num, cacheHeaders, cardData } from '../../../../lib/og';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
// 1200×675 "Share of MSTR" OG — 1 in N on red, X-safe margins.
export async function GET(req) {
  const pf = preflight(req, { browser: { limit: 60 }, anon: { limit: 60 }, prefix: 'card' });
  if (pf) return pf;
  const demo = new URL(req.url).searchParams.get('demo') === '1';
  const k = await cardData(demo);
  if (k.pool == null || !k.supply) {
    return new Response('Supply data unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  const F = await fonts();
  const D = { fontFamily: 'Bungee' };
  const M = { fontFamily: 'Space Mono', fontWeight: 700 };
  const n = Math.round(k.supply / k.pool);
  const shown = Math.min(n, 48);
  const hero = '1 IN ' + n;
  const heroSize = hero.length > 8 ? 140 : hero.length > 6 ? 168 : 196;
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 675,
          display: 'flex',
          flexDirection: 'column',
          padding: '48px 56px 40px',
          background: C.red,
          color: '#fff',
          position: 'relative',
          ...M
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -100,
            bottom: -100,
            width: 300,
            height: 300,
            borderRadius: 150,
            background: '#1c0809',
            opacity: 0.18,
            display: 'flex'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={markSrc('#ffffff')} width={52} height={36} />
            <span style={{ ...D, fontSize: 24, marginLeft: 14 }}>STRATEGY COIN</span>
          </div>
          <span style={{ fontSize: 16, letterSpacing: 1.5 }}>
            THE $STRATEGY POOL HOLDS{k.demo ? ' · SAMPLE' : ''}
          </span>
        </div>
        <div style={{ ...D, fontSize: heroSize, lineHeight: 0.92, marginTop: 28, zIndex: 1 }}>{hero}</div>
        <div style={{ fontSize: 26, marginTop: 8, letterSpacing: 0.5, zIndex: 1 }}>
          of every MSTR token on Robinhood Chain
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', width: 780, marginTop: 28, zIndex: 1 }}>
          {Array.from({ length: shown }, (_, i) => (
            <div
              key={i}
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                marginRight: 18,
                marginBottom: 12,
                display: 'flex',
                ...(i
                  ? { border: '3px solid rgba(255,255,255,.42)' }
                  : { background: '#fff', boxShadow: '0 0 20px rgba(255,255,255,.85)' })
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', flexGrow: 1 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, zIndex: 1 }}>
          <span>{`${num(k.pool)} of ${num(k.supply)} MSTR · ${(k.pool / k.supply * 100).toFixed(2)}%`}</span>
          <span style={{ letterSpacing: 1 }}>strategycoin.io</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 675,
      fonts: F.length ? F : undefined,
      headers: { ...cacheHeaders(demo), 'Content-Type': 'image/png' }
    }
  );
}
