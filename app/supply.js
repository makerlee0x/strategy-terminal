'use client';
// Share of supply: the $STRATEGY pool's share of all Robinhood MSTR, told as "1 in N": one lit token among N.
import { num } from './data'; import ShareButton from './sharebtn';
export default function ShareOfSupply({ S, RH }) {
  const pool = S?.stockInPool, rh = RH?.supply, pct = pool != null && rh ? pool / rh * 100 : null, n = pct ? Math.round(100 / pct) : null;
  const post = `1 in every ${n} Robinhood MSTR tokens sits in the $STRATEGY pool.`;
  return <section id="supply" style={{ display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'center' }}>
    <div style={{ flex: '1 1 340px', minWidth: 0 }}><div className="eyebrow" style={{ marginTop: 72 }}>Share of supply</div>
      <h2 className="sec-h" style={{ marginTop: 10 }}>We stack MSTR.</h2>
      <p className="sub" style={{ margin: '0 0 24px' }}>Saylor stacks bitcoin. The $STRATEGY pool stacks MSTR: it holds a slice of every MSTR token on Robinhood Chain. Every buy adds to it, and the number gets smaller.</p>
      <ShareButton card="supply" ready={n != null} text={post} />
      <p className="k" style={{ textTransform: 'none', letterSpacing: 0, marginTop: 18 }}>Pool MSTR is the pool’s inventory, not a redemption right.</p></div>
    <div style={{ flex: '999 1 460px', minWidth: 0, background: 'var(--red)', color: 'var(--on-red)', padding: 26, boxShadow: '6px 6px 0 var(--ink)', marginTop: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, letterSpacing: '.08em' }}><span>THE $STRATEGY POOL HOLDS</span><span className="tag" style={{ marginLeft: 0 }}>ON-CHAIN</span></div>
      <div className="big" style={{ fontSize: 'clamp(64px, 11vw, 120px)', lineHeight: .95, marginTop: 16 }}>{n ? <>1 IN {n}</> : '—'}</div>
      <div style={{ fontSize: 15, marginTop: 8 }}>of every MSTR token on Robinhood Chain</div>
      {n != null && n <= 200 && <div className="oneof" role="img" aria-label={`One lit token out of ${n}`}>{Array.from({ length: n }, (_, i) => <i key={i} className={i ? '' : 'me'} />)}</div>}
      <div style={{ fontSize: 12 }}>{pct != null ? pct.toFixed(2) + '% · ' : ''}{pool != null ? num(pool) : '—'} of {rh ? num(rh) : '—'} MSTR tokens · Robinhood Chain</div></div>
  </section>;
}
