'use client';
// MSTR in the STRATEGY/MSTR pool over time: a rising floor (MSTR compounded into the pool by trading fees),
// a dotted line (all MSTR in the pool, moving with buys and sells) and volume bars. Days = last 30 days, Weeks = weekly, All = every day.
import { useState } from 'react';
const X0 = 40, X1 = 752, Y0 = 250, YT = 20, VB = 322, VH = 44;
const dt = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
function view(days, range) {
  if (range === 'D') return days.slice(-30);
  if (range !== 'W') return days;
  const out = [];
  for (let i = 0; i < days.length; i += 7) { const g = days.slice(i, i + 7), last = g[g.length - 1]; out.push({ ...last, volUsd: g.some(x => x.volUsd != null) ? g.reduce((a, x) => a + (x.volUsd || 0), 0) : null }); }
  return out;
}
export default function PoolChart({ days, live, since }) {
  const [range, setRange] = useState('D');
  // Recorded days, plus today's live reading so the line reaches the present.
  const all = [...(days || [])]; if (live && (!all.length || all[all.length - 1].d < live.d)) all.push(live);
  const pts = all.length ? view(all, range) : [];
  if (pts.length < 2) return <>
    <div className="lbl">MSTR in the pool</div><div className="soft" style={{ fontSize: 12, marginTop: 4 }}>$STRATEGY/MSTR · Uniswap v4 · Robinhood Chain</div>
    <div className="num" style={{ fontSize: 72, margin: '48px 0 10px' }}>{live ? Math.round(live.poolMstr).toLocaleString('en-US') : '—'}</div>
    <div style={{ fontSize: 13, maxWidth: 460, lineHeight: 1.55 }}>MSTR in the pool right now. The chart records one point a day{since ? ' since ' + dt(since) : ''} and draws itself as the days add up: the dotted line for all MSTR in the pool, the red floor for MSTR compounded by fees.</div></>;
  const max = Math.max(...pts.map(p => p.poolMstr)) * 1.12, vols = pts.map(p => p.volUsd).filter(v => v != null), vmax = vols.length ? Math.max(...vols) : 0;
  const x = i => X0 + i * (X1 - X0) / (pts.length - 1), y = v => Y0 - v / max * (Y0 - YT);
  const floor = 'M' + X0 + ' ' + Y0 + pts.map((p, i) => ' L' + x(i).toFixed(1) + ' ' + y(p.feeMstr).toFixed(1)).join('') + ' L' + X1 + ' ' + Y0 + ' Z';
  const pool = pts.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.poolMstr).toFixed(1)).join(' ');
  const bw = Math.max(3, (X1 - X0) / pts.length * 0.6);
  const bars = vmax ? pts.map((p, i) => { if (p.volUsd == null) return ''; const h = p.volUsd / vmax * VH, bx = Math.min(Math.max(x(i) - bw / 2, X0), X1 - bw); return 'M' + bx.toFixed(1) + ' ' + (VB - h).toFixed(1) + ' h' + bw.toFixed(1) + ' v' + h.toFixed(1) + ' h-' + bw.toFixed(1) + ' Z'; }).join(' ') : '';
  const step = Math.max(100, Math.round(max / 3 / 100) * 100), last = pts[pts.length - 1];
  return <>
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <div><div className="lbl">MSTR in the pool</div><div className="soft" style={{ fontSize: 12, marginTop: 4 }}>$STRATEGY/MSTR · Uniswap v4 · Robinhood Chain</div></div>
      <div className="seg2" role="group" aria-label="Chart range">{[['D', 'DAYS'], ['W', 'WEEKS'], ['A', 'ALL']].map(([k, l]) => <button key={k} type="button" className={k === range ? 'on' : ''} aria-pressed={k === range} onClick={() => setRange(k)}>{l}</button>)}</div></div>
    <svg viewBox="0 0 760 330" style={{ width: '100%', height: 'auto', display: 'block', marginTop: 16 }} role="img" aria-label={`MSTR in the pool, ${dt(pts[0].d)} to ${dt(last.d)}: ${Math.round(last.poolMstr)} MSTR now, ${Math.round(last.feeMstr)} of it compounded from fees.`}>
      {[step, step * 2].map(v => <g key={v}><line x1={X0} x2={X1} y1={y(v)} y2={y(v)} stroke="#1c080922" /><text x="0" y={y(v) + 4} fontSize="11" fill="#5e4a44" fontFamily="Space Mono, monospace">{v}</text></g>)}
      <line x1={X0} x2={X1} y1={Y0} y2={Y0} stroke="#1c0809" />
      <path d={floor} fill="#d9232e" />
      <path d={pool} fill="none" stroke="#1c0809" strokeWidth="2.5" strokeDasharray="5 5" />
      <circle cx={x(pts.length - 1)} cy={y(last.poolMstr)} r="5" fill="#1c0809" />
      {bars && <path d={bars} fill="#1c080955" />}
      <line x1={X0} x2={X1} y1={VB} y2={VB} stroke="#1c080933" />
      <text x={X0} y="270" fontSize="11" fill="#5e4a44" fontFamily="Space Mono, monospace">{dt(pts[0].d)}</text>
      <text x={X1} y="270" fontSize="11" fill="#5e4a44" textAnchor="end" fontFamily="Space Mono, monospace">{dt(last.d)}</text>
    </svg>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 22px', fontSize: 12, marginTop: 10 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 14, height: 14, background: '#d9232e', display: 'inline-block' }} />MSTR compounded into the pool by trading fees</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 18, borderTop: '2.5px dashed #1c0809', display: 'inline-block' }} />MSTR in the pool: moves with buys and sells</span>
      {bars && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 14, height: 14, background: '#1c080955', display: 'inline-block' }} />Trading volume</span>}</div>
  </>;
}
