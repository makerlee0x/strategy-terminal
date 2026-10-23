'use client';
// MSTR On-Chain: for MSTR token holders. How much exists, where it trades, how to put Robinhood MSTR to work, and how it works.
import { useEffect, useState } from 'react';
import { fmt, num, pct, St } from '../data'; import { useLive } from '../../lib/useLive'; import { MSTR } from '../feeds'; import { CopyAddr, ADDR } from '../strategy/Modals';
const TABS = [['overview', 'Overview'], ['work', 'Put it to work'], ['how', 'How it works']];
const dt = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const Risk = ({ children }) => <p className="risk" style={{ margin: '14px 0 0' }}>Risk: {children}</p>;
const Out = ({ href, children }) => <a href={href} target="_blank" rel="noopener" style={{ display: 'inline-block', marginTop: 14, fontSize: 13, fontWeight: 700 }}>{children} ↗</a>;
export default function View({ init }) {
  const [T, SM, F8, OH, CH, PP] = useLive(MSTR, undefined, init);
  const [tab, setTab] = useState('overview');
  // Highlight the tab for the section being read, and follow it as the page scrolls either way.
  useEffect(() => {
    const spy = () => { let cur = TABS[0][0]; for (const [id] of TABS) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < innerHeight * 0.35) cur = id; } if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = TABS[TABS.length - 1][0]; setTab(cur); };
    spy(); addEventListener('scroll', spy, { passive: true }); addEventListener('resize', spy); return () => { removeEventListener('scroll', spy); removeEventListener('resize', spy); };
  }, []);
  const t = T?.totals || {}, venues = (CH?.chains || []).filter(c => c.vol24Usd > 0).sort((a, b) => b.vol24Usd - a.vol24Usd), vmax = venues[0]?.vol24Usd || 1;
  const rh = (CH?.chains || []).find(c => c.key === 'robinhood'), off = OH?.all?.d30?.closedPct, f = F8?.latest, chg = F8?.weeklyChangeBtc;
  const hl = (PP?.markets || []).find(m => m.venue === 'Hyperliquid'), li = (PP?.markets || []).find(m => m.venue === 'Lighter');
  return (<>
    <div className="pagehead"><div><div className="lbl" style={{ color: 'var(--red-t)' }}>For MSTR token holders · <St d={T} /></div><h1>MSTR, ON-CHAIN.</h1>
      <p className="sub" style={{ fontSize: 15, maxWidth: 620, margin: 0 }}>Strategy₿ Inc. stock (MSTR) now trades as a token, 24/7. How much exists, where it trades, how to put it to work, and how it works.</p></div>
      <CopyAddr light label="MSTR · Robinhood stock token" addr={ADDR.MSTR} /></div>
    <div className="tabs2" role="navigation" aria-label="On this page">{TABS.map(([k, l]) => <a key={k} href={'#' + k} className={tab === k ? 'on' : ''} aria-current={tab === k ? 'true' : undefined}>{l.toUpperCase()}</a>)}</div>

    <h2 className="sec2" id="overview" style={{ marginTop: 36 }}>Overview</h2><p className="sub" style={{ margin: '0 0 18px' }}>Every issuer, every chain.</p>
    <div className="bento">
      <div className="tile-red s6 stack"><div className="lbl">MSTR tokens on-chain</div><div className="num" style={{ fontSize: 60 }}>{num(t.circ)}</div><div style={{ fontSize: 13 }}>worth {fmt(t.mcap)} · 1 token tracks 1 share</div></div>
      <div className="tile s3 stack"><div className="lbl">Share of MSTR on-chain</div><div className="num ox" style={{ fontSize: 40 }}>{pct(t.pctShares)}</div><div className="soft" style={{ fontSize: 12 }}>of ~{t.sharesBasis ? (t.sharesBasis / 1e6).toFixed(0) : '—'}M shares</div></div>
      <div className="tile s3 stack"><div className="lbl">Traded off-hours</div><div className="num" style={{ fontSize: 40 }}>{pct(off, 0)}</div><div className="soft" style={{ fontSize: 12 }}>of 30-day volume, while Nasdaq was closed</div></div>
      <div className="tile s7"><div className="lbl">Where it trades · 24h DEX volume</div>
        {!venues.length && <div className="soft" style={{ fontSize: 13, marginTop: 14 }}>{CH && CH.ok === false ? 'Volume data is delayed. Check back in a few minutes.' : 'Loading volume by chain…'}</div>}
        <div style={{ marginTop: 14 }}>{venues.map(c => <div key={c.key} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 64px', gap: 12, alignItems: 'center', padding: '6px 0', fontSize: 13 }}>
          <span style={{ fontWeight: c.key === 'robinhood' ? 700 : 400 }}>{c.chain}</span><span style={{ background: '#1c080914', height: 14 }}><span style={{ display: 'block', height: 14, width: Math.max(1, c.vol24Usd / vmax * 100) + '%', background: c.key === 'robinhood' ? 'var(--red)' : '#1c080966' }} /></span><span style={{ textAlign: 'right' }}>{fmt(c.vol24Usd)}</span></div>)}</div>
        {venues.length > 0 && <div className="soft" style={{ fontSize: 12, marginTop: 10 }}>{fmt(CH?.totalDexVol24Usd)} traded on DEXes, all chains</div>}</div>
      <div className="tile-line s5 stack"><div className="lbl">Strategy₿ Inc.’s bitcoin · latest 8-K</div><div className="num" style={{ fontSize: 52 }}>{num(f?.btcHeld)}</div>
        <div style={{ fontSize: 13 }}>{chg != null && <b style={{ color: 'var(--red-t)' }}>{(chg >= 0 ? '+' : '') + num(chg)} BTC</b>}{F8?.previous?.asOf ? ' since ' + F8.previous.asOf.replace(/, \d{4}$/, '').replace(/^(\w{3})\w*/, '$1') : ''}{f?.doc && <> · <a href={f.doc} target="_blank" rel="noopener" style={{ color: 'var(--ink)' }}>8-K filed {dt(f.filingDate)} ↗</a></>}</div></div>
    </div>

    <h2 className="sec2" id="work">Put it to work</h2><p className="sub" style={{ margin: '0 0 18px' }}>What you can do with Robinhood MSTR on Robinhood Chain, plus 24/7 trading on Hyperliquid and Lighter.</p>
    <div className="bento">
      <div className="tile s4"><div className="lbl ox">01 · Earn fees</div><p style={{ fontSize: 14, lineHeight: 1.5 }}>Provide liquidity in an MSTR pool on Robinhood Chain and earn a share of every trade.</p>
        <div className="orow"><span>MSTR pool liquidity</span><b>{fmt(rh?.dexLiquidityUsd)}</b></div><div className="orow"><span>Traded, last 24h</span><b>{fmt(rh?.vol24Usd)}</b></div>
        <Risk>if MSTR moves a lot, you end up holding more of whichever side fell. Fees change with volume.</Risk><Out href="https://app.uniswap.org/explore/tokens/robinhood/0xec262a75e413fAfD0dF80480274532C79D42da09">Browse MSTR pools on Uniswap</Out></div>
      <div className="tile s4"><div className="lbl ox">02 · Borrow</div><p style={{ fontSize: 14, lineHeight: 1.5 }}>Keep your MSTR and borrow stablecoins against it.</p>
        <div className="orow"><span><a href="https://pro.teller.org/borrow?collateral=mstr" target="_blank" rel="noopener"><b>Teller</b> ↗</a> · fixed term</span><span>no margin calls</span></div>
        <div className="orow"><span><a href="https://www.longbow.cash/borrow/MSTR" target="_blank" rel="noopener"><b>Longbow</b> ↗</a> · borrow against MSTR</span><span></span></div>
        <Risk>if MSTR falls past the liquidation level, your collateral is sold.</Risk></div>
      <div className="tile-line s4"><div className="lbl" style={{ color: 'var(--red-t)' }}>03 · Trade 24/7</div><p style={{ fontSize: 14, lineHeight: 1.5 }}>MSTR perpetual futures trade nights and weekends.</p>
        {hl && <div className="orow" style={{ borderColor: 'var(--rule)' }}><span><a href="https://app.hyperliquid.xyz/trade/xyz:MSTR" target="_blank" rel="noopener" style={{ color: 'var(--ink)' }}><b>Hyperliquid</b> ↗</a> · {hl.market}</span><span>{fmt(hl.vol24Usd)} · 24h</span></div>}
        {li && <div className="orow" style={{ borderColor: 'var(--rule)' }}><span><a href="https://app.lighter.xyz/trade/MSTR" target="_blank" rel="noopener" style={{ color: 'var(--ink)' }}><b>Lighter</b> ↗</a> · {li.market}</span><span>{fmt(li.vol24Usd)} · 24h</span></div>}
        <p className="risk" style={{ margin: '14px 0 0', color: 'var(--ink)' }}>Risk: perps use leverage. A move against you can wipe out your margin.</p></div>
    </div>

    <h2 className="sec2" id="how">How it works</h2><p className="sub" style={{ margin: '0 0 18px' }}>Three things, then you’re caught up.</p>
    <div className="bento">{[
      ['Where tokens come from', 'A market maker buys real MSTR shares, the issuer locks them and mints the same number of tokens. To exit, tokens are burned and the shares released. You just buy and sell.'],
      ['It trades 24/7. Nasdaq doesn’t.', 'MSTR tokens trade nights and weekends, so the token price can drift away from the last share price. Market makers pull it back by minting and burning when they can.'],
      ['Good to know', <>Tokens give price exposure, not shareholder votes (for now). <a href="https://robinhood.com/rhj/stocktokens/" target="_blank" rel="noopener" style={{ color: 'inherit' }}>Robinhood Stock Tokens ↗</a></>]].map(([h, b], i) =>
      <div key={h} className={(i === 2 ? 'tile-line' : 'tile') + ' s4'}><div className={'num' + (i === 2 ? '' : ' ox')} style={{ fontSize: 28 }}>0{i + 1}</div><h3 style={{ fontSize: 16, margin: '12px 0 8px' }}>{h}</h3><p style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>{b}</p></div>)}</div>
  </>);
}
