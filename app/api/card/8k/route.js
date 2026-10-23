import { ImageResponse } from 'next/og';
import { preflight, cachedFetch } from '../../../../lib/guard';
import { loadFilings } from '../../../../lib/filings';
import { poolBacking } from '../../../../lib/poolBacking';
import { eightK, signed } from '../../../../lib/eightk.mjs';
import { fonts, logo, withHeaders } from '../../../../lib/og';
export const dynamic = 'force-dynamic';
// 1200×675 8-K day card (the /8k share image). Same layout as EightKCard in app/eightk.js.
// ?demo=1 renders labelled sample data, for checking the design without live sources.
const C = { bg: '#1c0809', panel: '#3a1416', ink: '#f3e6dc', mu: '#c7aaa3', red: '#d9232e', redT: '#ff5a63' };
const DEMO = { filingDate: '2026-10-13', btcHeld: 848250, change: 250, per1M: 1.37 };
const num = v => v == null ? '—' : Math.round(v).toLocaleString('en-US');
const day = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

export async function GET(req) {
  const pf = preflight(req, { browser: { limit: 30 }, anon: { limit: 30 }, prefix: 'card' }); if (pf) return pf;
  const demo = new URL(req.url).searchParams.get('demo') === '1';
  let k = demo ? DEMO : null;
  if (!demo) {
    try {
      const [F8, PB] = await Promise.all([cachedFetch('filings', 3_600_000, loadFilings).then(r => r.value), cachedFetch('pb-card', 90_000, () => poolBacking()).then(r => r.value).catch(() => null)]);
      k = eightK(F8, PB ? PB.stockInPool / 1e3 : null);
    } catch (_) { k = null; }
  }
  if (!k) return new Response('8-K data unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  const [F, L] = await Promise.all([fonts(), logo(req)]);
  const D = { fontFamily: 'Bungee' }, M = { fontFamily: 'Space Mono', fontWeight: 700 };
  const box = (label, v, d, red) => <div style={{ display: 'flex', flexDirection: 'column', background: red ? C.red : C.panel, color: red ? '#fff' : C.ink, padding: '16px 20px' }}>
    <div style={{ ...M, fontSize: 13, letterSpacing: 1, color: red ? '#fff' : C.mu }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 4 }}><span style={{ ...D, fontSize: 34 }}>{v}</span>{d ? <span style={{ ...D, fontSize: 20, marginLeft: 12, color: red ? '#fff' : C.redT }}>{d}</span> : null}</div></div>;
  const down = <div style={{ ...D, fontSize: 22, color: C.redT, paddingLeft: 20 }}>↓</div>;
  return withHeaders(new ImageResponse(
    <div style={{ width: 1200, height: 675, display: 'flex', flexDirection: 'column', position: 'relative', padding: '44px 52px', background: C.bg, color: C.ink, ...M }}>
      <div style={{ position: 'absolute', right: -90, top: -90, width: 240, height: 240, borderRadius: 120, background: C.red, display: 'flex' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {L ? <img src={L} height={40} width={287} /> : <div style={{ ...D, fontSize: 30 }}>STRATEGY COIN</div>}
        <div style={{ fontSize: 15, letterSpacing: 2, marginRight: 110 }}>{`8-K DAY · ${day(k.filingDate)}${demo ? ' · SAMPLE' : ''}`}</div></div>
      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: 520 }}>
          <div style={{ fontSize: 18, letterSpacing: 2, color: C.redT }}>{k.change > 0 ? 'SAYLOR BOUGHT' : k.change < 0 ? 'STRATEGY₿ INC. SOLD' : 'NO NEW BTC'}</div>
          <div style={{ ...D, fontSize: 150, lineHeight: 1, marginTop: 8, textShadow: `6px 6px 0 ${C.red}` }}>{signed(k.change)}</div>
          <div style={{ ...D, fontSize: 56, lineHeight: 1 }}>BTC</div></div>
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, marginLeft: 48 }}>
          {box('STRATEGY₿ INC. HOLDS', num(k.btcHeld) + ' BTC')}{down}{box('MSTR', 'AMPLIFIED BTC')}{down}{box('EVERY 1M $STRATEGY HOLDS', (k.per1M != null ? k.per1M.toFixed(2) : '—') + ' MSTR', null, 1)}</div></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.mu }}><span style={{ color: C.ink }}>strategycoin.io</span><span>Source: SEC EDGAR 8-K · Not affiliated with Strategy₿ Inc.</span></div>
    </div>,
    { width: 1200, height: 675, fonts: F.length ? F : undefined }), { 'Cache-Control': demo ? 'no-store' : 'public, max-age=0, s-maxage=1800, stale-while-revalidate=3600' });
}
