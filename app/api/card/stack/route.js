import { ImageResponse } from 'next/og';
import { preflight } from '../../../../lib/guard';
import { C, fonts, markSrc, today, num, cacheHeaders, cardData } from '../../../../lib/og';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
// 1200×675 homepage / share OG — brand-first, X-safe margins, live MSTR-per-1M.
export async function GET(req) {
  const pf = preflight(req, { browser: { limit: 60 }, anon: { limit: 60 }, prefix: 'card' });
  if (pf) return pf;
  const demo = new URL(req.url).searchParams.get('demo') === '1';
  const k = await cardData(demo);
  if (k.pool == null) {
    return new Response('Pool data unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  const F = await fonts();
  const D = { fontFamily: 'Bungee' };
  const M = { fontFamily: 'Space Mono', fontWeight: 700 };
  const per = (k.pool / 1e3).toFixed(2);
  const n = k.supply ? Math.round(k.supply / k.pool) : null;
  const heroSize = per.length >= 5 ? 168 : per.length >= 4 ? 200 : 228;
  const stat = (label, v) => (
    <div style={{ display: 'flex', flexDirection: 'column', marginRight: 48 }}>
      <div style={{ fontSize: 15, color: C.mu, letterSpacing: 1.2 }}>{label}</div>
      <div style={{ ...D, fontSize: 40, marginTop: 6, color: C.ink }}>{v}</div>
    </div>
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 675,
          display: 'flex',
          flexDirection: 'column',
          padding: '48px 56px 40px',
          background: C.bg,
          color: C.ink,
          position: 'relative',
          ...M
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -120,
            top: -140,
            width: 360,
            height: 360,
            borderRadius: 180,
            background: C.red,
            opacity: 0.22,
            display: 'flex'
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -80,
            bottom: -120,
            width: 280,
            height: 280,
            borderRadius: 140,
            background: C.red,
            opacity: 0.1,
            display: 'flex'
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={markSrc(C.red)} width={58} height={40} />
            <span style={{ ...D, fontSize: 28, marginLeft: 16, letterSpacing: 1 }}>STRATEGY COIN</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span
              style={{
                fontSize: 14,
                letterSpacing: 2,
                color: '#fff',
                background: C.red,
                padding: '8px 14px'
              }}
            >
              AMPLIFIED MSTR
            </span>
            <span style={{ fontSize: 15, color: C.mu, letterSpacing: 1 }}>
              {today()}
              {k.demo ? ' · SAMPLE' : ''}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 28, zIndex: 1 }}>
          <div style={{ fontSize: 18, letterSpacing: 2, color: C.mu }}>EVERY 1M $STRATEGY</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 4 }}>
            <div style={{ ...D, fontSize: heroSize, lineHeight: 0.9, color: C.redT }}>{per}</div>
            <div
              style={{
                ...D,
                fontSize: 42,
                color: C.ink,
                marginLeft: 18,
                marginBottom: 18,
                letterSpacing: 1
              }}
            >
              MSTR
            </div>
          </div>
          <div style={{ fontSize: 26, marginTop: 10, letterSpacing: 1, color: C.ink }}>
            IN THE POOL · HOLD. HOLD. AMPLIFY.
          </div>
        </div>

        <div style={{ display: 'flex', flexGrow: 1 }} />

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            borderTop: '3px solid rgba(243,230,220,.22)',
            paddingTop: 22,
            zIndex: 1
          }}
        >
          {stat('MSTR IN POOL', num(k.pool))}
          {n ? stat('OF ROBINHOOD MSTR', '1 IN ' + n) : null}
          {k.holders ? stat('HOLDERS', k.holders) : null}
          <div style={{ display: 'flex', flexGrow: 1 }} />
          <span style={{ fontSize: 20, letterSpacing: 1 }}>strategycoin.io</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 675,
      fonts: F.length ? F : undefined,
      headers: {
        ...cacheHeaders(demo),
        'Content-Type': 'image/png'
      }
    }
  );
}
