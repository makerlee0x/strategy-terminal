'use client';
// $STRATEGY: the coin, what its pool holds and how it grows. Ivory bento tiles on oxblood.
import { St, fmt } from '../data'; import Actions, { CopyAddr, ADDR } from './Modals'; import PoolChart from './PoolChart'; import { useLive } from '../../lib/useLive'; import { STATS } from '../feeds'; import { summarize, record } from '../../lib/metrics.mjs';
const POOL = 'https://app.uniswap.org/explore/pools/robinhood/0xa6975f4720a95aa9cdfa9b010a065b0e941534c93f9fa708104c08f0ac029ca0';
const L = [['Uniswap pool', POOL], ['Dexscreener', 'https://dexscreener.com/robinhood/0xa6975f4720a95aa9cdfa9b010a065b0e941534c93f9fa708104c08f0ac029ca0'], ['Explorer', 'https://robinhoodchain.blockscout.com/token/' + ADDR.STRATEGY], ['@strategystock', 'https://x.com/strategystock']];
const n0 = v => v == null || !Number.isFinite(v) ? '—' : Math.round(v).toLocaleString('en-US');
const pc = v => v == null ? '—' : (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
const CALC = [
  ['MSTR in the pool', 'Tokenized MSTR held by the $STRATEGY/MSTR pool on Robinhood Chain. It is the pool’s inventory, not a redemption right.'],
  ['Compounded by fees', 'MSTR in the pool above what the launch liquidity alone would hold at today’s price. The pool launched with only $STRATEGY, so MSTR on the launch curve came from buyers and MSTR above it came from fees.'],
  ['MSTR per 1M $STRATEGY', 'MSTR in the pool ÷ 1B coins × 1M. The coin’s version of Strategy₿ Inc.’s bitcoin per share.'],
  ['MSTR Yield', 'MSTR compounded by fees over 30 days ÷ MSTR in the pool 30 days ago. MSTR that came in because the price went up is not counted.'],
  ['History', 'One snapshot of the pool per day, kept from the first day recorded. The chart and the 30-day yield use only recorded days.']];
export default function View({ init }) {
  const [SM, PO, PB, H] = useLive(STATS, undefined, init);
  const M = SM?.display || {}, s = PB?.strategy && !PB.strategy.error ? PB.strategy : null, S = H?.days?.length ? summarize(H.days) : null, live = s ? record(s) : null;
  const pool = s?.stockInPool, fee = s ? Math.max(0, s.stockInPool - s.curveStock) : null, per1M = pool != null ? pool / 1e3 : null;
  const pools = (PO?.pools || []).slice(0, 10).map(p => ({ id: p.id, name: p.pair, dex: p.dex, liq: fmt(p.liquidityUsd), vol: fmt(p.volume24hUsd) }));
  return (<>
    <div className="pagehead"><div><div className="lbl" style={{ color: 'var(--red-t)' }}>The coin · <St d={SM} /></div><h1>$STRATEGY</h1>
      <p className="sub" style={{ fontSize: 15, maxWidth: 620, margin: 0 }}>Paired with tokenized MSTR on Robinhood Chain. Every buy adds MSTR to the pool, and part of every trading fee is added back to it, permanently.</p></div>
      <div style={{ display: 'flex', gap: 28 }}><div><div className="lbl">Price</div><div className="num" style={{ fontSize: 24, marginTop: 6 }}>{M.priceUsd || '—'}</div>{M.change24h && <div style={{ fontSize: 12, marginTop: 4, color: M.change24hPositive ? 'var(--ink)' : 'var(--red-t)' }}>{(M.change24hPositive ? '+' : '−') + M.change24h.replace('-', '')} · 24h</div>}</div>
        <div><div className="lbl">Market cap</div><div className="num" style={{ fontSize: 24, marginTop: 6 }}>{M.marketCap || '—'}</div></div></div></div>
    <div className="bento">
      <div className="tile s8 r2"><PoolChart days={H?.days} live={live} since={H?.since} /></div>
      <div className="tile-red s4 stack"><div className="lbl">MSTR in the pool</div><div className="num" style={{ fontSize: 64 }}>{n0(pool)}</div>
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>tokenized MSTR, right now{s ? <>: {n0(pool - fee)} in the locked launch liquidity + {n0(fee)} compounded from fees</> : ''}</div></div>
      <div className="tile s4 stack"><div className="lbl">MSTR per 1M $STRATEGY</div><div className="num ox" style={{ fontSize: 64 }}>{per1M != null ? per1M.toFixed(2) : '—'}</div><div className="soft" style={{ fontSize: 13 }}>The coin’s bitcoin-per-share.</div></div>
      <div className="tile s3 sq stack"><div className="lbl">MSTR Yield · 30D</div><div className="num ox" style={{ fontSize: 40 }}>{pc(S?.yield30d)}</div><div className="soft" style={{ fontSize: 12 }}>{S?.yield30d == null ? 'Shows once 30 days of daily history are recorded.' : 'MSTR added by fees ÷ MSTR in the pool 30 days ago.'}</div></div>
      <div className="tile-line s3 sq stack"><div className="lbl">Compounded by fees</div><div className="num" style={{ fontSize: 40 }}>{n0(fee)}</div><div style={{ fontSize: 12, opacity: .8 }}>MSTR added back to the pool by fees, all time. The floor in the chart.</div></div>
      <div className="tile s3 sq stack"><div className="lbl">Holders</div><div className="num" style={{ fontSize: 40 }}>{M.holders || '—'}</div><div className="soft" style={{ fontSize: 12 }}>wallets holding $STRATEGY</div></div>
      <div className="tile s3 sq stack"><div className="lbl">Supply</div><div className="num" style={{ fontSize: 40 }}>1B</div><div className="soft" style={{ fontSize: 12 }}>fixed at launch. Never minted again.</div></div>
      <div className="tile s8"><div className="lbl">How the pool works</div>
        <div className="steps3">{['$STRATEGY trades against real tokenized MSTR in one Uniswap pool.', 'Every buy adds MSTR to the pool. Every sell takes some out.', 'Part of every trade’s fee is added back to the pool, permanently. That’s the floor: it only rises.'].map((t, i) =>
          <div key={i}><div className="num ox" style={{ fontSize: 28 }}>0{i + 1}</div><p style={{ fontSize: 14, lineHeight: 1.5, margin: '8px 0 0' }}>{t}</p></div>)}</div>
        <p className="soft" style={{ fontSize: 12, margin: '18px 0 0' }}>The liquidity pool is locked and can’t be withdrawn. Pool MSTR is the pool’s inventory, not a redemption right.</p>
        <details className="calc" style={{ marginTop: 12 }}><summary>How we calculate each number</summary><dl>{CALC.map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl></details></div>
      <div className="tile-dash s4 stack"><div className="lbl" style={{ color: 'var(--red-t)' }}>STRATEGY COIN Reserve</div><div className="num" style={{ fontSize: 30 }}>Coming soon</div></div>
      <div className="tile-red s12" id="buy-band" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18 }}>
        <a className="pillbtn" href="#buy" style={{ background: 'var(--bg)', color: 'var(--on-red)' }}>buy $strategy</a>
        <CopyAddr label="$STRATEGY" addr={ADDR.STRATEGY} /><CopyAddr label="MSTR · Robinhood" addr={ADDR.MSTR} />
        <span style={{ fontSize: 13 }}>{L.map(([t, u], i) => <span key={t}>{i ? ' · ' : ''}<a href={u} target="_blank" rel="noopener" style={{ color: 'var(--on-red)' }}>{t} ↗</a></span>)}</span></div>
    </div>
    <Actions bare asOf={PO?.fetchedAt?.slice(0, 10) || ''} pools={pools} /></>);
}
