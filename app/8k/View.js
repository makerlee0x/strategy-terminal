'use client';
import { useLive } from '../../lib/useLive'; import { St } from '../data'; import { ShareX } from '../ui'; import { EIGHTK } from '../feeds'; import { EightKCard } from '../eightk'; import { eightK, headline } from '../../lib/eightk.mjs';
export default function View({ init }) {
  const [F8, PB] = useLive(EIGHTK, undefined, init);
  const S = PB?.strategy && !PB.strategy.error ? PB.strategy : null, k = eightK(F8, S ? S.stockInPool / 1e3 : null);
  const post = k ? `${headline(k)} MSTR is amplified bitcoin. Every 1M $STRATEGY holds ${k.per1M != null ? k.per1M.toFixed(2) : '—'} MSTR.` : '';
  return (<><div className="eyebrow">8-K day · latest Strategy₿ Inc. filing · <St d={F8} s="SEC EDGAR" /></div>
    <h1 className="d">8-K <em>day.</em></h1><p className="sub" style={{ fontSize: 15 }}>Every time Strategy₿ Inc. files a bitcoin 8-K: Strategy₿ Inc. stacks BTC, MSTR is amplified bitcoin, and $STRATEGY is amplified MSTR.</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', margin: '18px 0 24px' }}>
      <ShareX ready={!!k && k.per1M != null} text={post} url="https://strategycoin.io/8k/" style={{ marginTop: 0, background: 'var(--red)', color: 'var(--on-red)', boxShadow: '4px 4px 0 var(--ink)' }} />
      <a className="btn" href="/api/card/8k" download="strategy-8k.png" style={{ marginTop: 0 }}>download image</a>
      {k?.doc && <a href={k.doc} target="_blank" rel="noopener" style={{ color: 'var(--red-t)' }}>Read the 8-K ↗</a>}</div>
    <div className="cardwrap">{k ? <EightKCard k={k} /> : <div className="k">Loading the latest filing…</div>}</div>
    <p className="k" style={{ textTransform: 'none', letterSpacing: 0, marginTop: 16 }}>BTC holdings from Strategy₿ Inc.’s latest 8-K. MSTR per 1M $STRATEGY = MSTR in the $STRATEGY/MSTR pool ÷ 1B coins × 1M. Pool MSTR is inventory, not a redemption right.</p></>);
}
