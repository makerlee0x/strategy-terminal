'use client';
// 8-K day: banner for the homepage (shown for 72h after a filing) and the post-sized card for /8k.
import { num } from './data'; import { headline, signed } from '../lib/eightk.mjs';
const day = d => d ? new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase() : '—';
const Step = ({ k, v, d, light }) => <div style={{ flex: '1 1 240px', background: light ? 'var(--ink)' : 'var(--bg)', color: light ? 'var(--bg)' : 'var(--ink)', padding: 20 }}>
  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', color: light ? 'var(--bg)' : 'var(--mu)' }}>{k}</div>
  <div className="d" style={{ fontSize: 34, marginTop: 8 }}>{v}</div>
  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: light ? '#b51d27' : '#ff8a90' }}>{d}</div></div>;
const Arrow = () => <div className="d k8arrow" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', fontSize: 28 }}>→</div>;

export function EightKBanner({ k }) {
  return <section aria-label="New Strategy₿ Inc. 8-K" style={{ background: 'var(--red)', color: 'var(--on-red)', padding: 32, margin: '40px 0 0', boxShadow: '8px 8px 0 var(--ink)' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 700, letterSpacing: '.1em' }}><span className="pulse" style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />8-K DAY · FILED {day(k.filingDate)}</div>
      <span className="tag" style={{ marginLeft: 0 }}>SEC EDGAR</span></div>
    <h2 className="d" style={{ fontSize: 52, lineHeight: 1.02, margin: '18px 0 26px', border: 0, padding: 0, display: 'block', letterSpacing: 0 }}>{headline(k)}</h2>
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: 14 }}>
      <Step k="STRATEGY₿ INC. HOLDS" v={num(k.btcHeld) + ' BTC'} d={signed(k.change) + (k.prevAsOf ? ' vs ' + k.prevAsOf.replace(/, \d{4}$/, '') : '')} /><Arrow />
      <Step k="MSTR" v="AMPLIFIED BTC" d="1 token tracks 1 share" /><Arrow />
      <Step k="EVERY 1M $STRATEGY HOLDS" v={(k.per1M != null ? k.per1M.toFixed(2) : '—') + ' MSTR'} d="amplified MSTR" light /></div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', marginTop: 24 }}>
      <a className="btn" href="/8k/" style={{ marginTop: 0, background: 'var(--ink)', color: 'var(--bg)', boxShadow: '4px 4px 0 var(--bg)' }}>post the 8-K card</a>
      {k.doc && <a href={k.doc} target="_blank" rel="noopener" style={{ color: '#fff' }}>Read the 8-K ↗</a>}
      <span style={{ fontSize: 12, marginLeft: 'auto', color: '#ffe3e5' }}>Shows for 72 hours after each filing.</span></div>
  </section>;
}

/** 1200×675 card, same layout as the /api/card/8k image. */
export function EightKCard({ k }) {
  const box = (label, v, d, red) => <div style={{ background: red ? 'var(--red)' : 'var(--panel)', color: red ? '#fff' : 'var(--ink)', padding: '16px 20px' }}><div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', color: red ? '#fff' : 'var(--mu)' }}>{label}</div><div className="d" style={{ fontSize: 34, marginTop: 4 }}>{v} {d && <span style={{ fontSize: 20, color: red ? '#fff' : 'var(--red-t)' }}>{d}</span>}</div></div>;
  const down = <div className="d" aria-hidden="true" style={{ fontSize: 22, color: 'var(--red-t)', paddingLeft: 20 }}>↓</div>;
  return <div className="card" style={{ display: 'flex', flexDirection: 'column', boxShadow: 'none' }}>
    <div style={{ position: 'absolute', right: -90, top: -90, width: 240, height: 240, borderRadius: '50%', background: 'var(--red)' }} aria-hidden="true" />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}><img src="/strategy-logo.svg" alt="STRATEGY COIN" style={{ height: 40, width: 'auto' }} /><div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '.1em', marginRight: 110 }}>8-K DAY · {day(k.filingDate)}</div></div>
    <div style={{ display: 'flex', gap: 48, alignItems: 'center', flexGrow: 1 }}>
      <div style={{ flex: '1 1 0', minWidth: 0 }}><div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '.12em', color: 'var(--red-t)' }}>{k.change > 0 ? 'SAYLOR BOUGHT' : k.change < 0 ? 'STRATEGY₿ INC. SOLD' : 'NO NEW BTC'}</div>
        <div className="d" style={{ fontSize: 150, lineHeight: .95, marginTop: 8, textShadow: '6px 6px 0 var(--red)' }}>{signed(k.change)}</div><div className="d" style={{ fontSize: 56, lineHeight: 1 }}>BTC</div></div>
      <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {box('STRATEGY₿ INC. HOLDS', num(k.btcHeld) + ' BTC')}{down}{box('MSTR', 'AMPLIFIED BTC')}{down}{box('EVERY 1M $STRATEGY HOLDS', (k.per1M != null ? k.per1M.toFixed(2) : '—') + ' MSTR', null, 1)}</div></div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--mu)' }}><span style={{ color: 'var(--ink)', fontWeight: 700 }}>strategycoin.io</span><span>Source: SEC EDGAR 8-K · Not affiliated with Strategy₿ Inc.</span></div>
  </div>;
}
