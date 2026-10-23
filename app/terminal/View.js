'use client';
// An old-school terminal with fixed commands filled from live data. No AI: every answer is written here.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { fmt, num } from '../data'; import { useLive } from '../../lib/useLive'; import { TERMINAL } from '../feeds'; import { summarize } from '../../lib/metrics.mjs'; import { ADDR, copyText } from '../strategy/Modals'; import { useBuyExe } from './buyexe'; import { Mark } from '../mark';
const P = 'C:\\$STRATEGY>';
const n2 = v => v == null || !Number.isFinite(v) ? '—' : v.toFixed(2);
const pc = v => v == null ? '—' : (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
const dt = d => d ? new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() : '—';
const HELP = ['STACK · PRICE · POOL · MSTR · 8K', 'BUY · SELL · CA · GM · CLEAR · EXIT', '(THERE ARE OTHERS.)'];
export default function View({ init }) {
  const [SM, PB, H, F8, T, OH] = useLive(TERMINAL, undefined, init);
  const [log, setLog] = useState([]), [cmd, setCmd] = useState(''), [hist, setHist] = useState({ list: [], i: -1 });
  const [bright, setBright] = useState(1), [on, setOn] = useState(true), [laser, setLaser] = useState(false), [copied, setCopied] = useState(false);
  const inp = useRef(), scr = useRef(), room = useRef();
  const exe = useBuyExe(setLog);
  // Fit the terminal to one screen: measure where it starts (the menu wraps differently by width).
  useLayoutEffect(() => { const fit = () => { const el = room.current; if (el) el.style.setProperty('--term-top', Math.round(el.getBoundingClientRect().top + scrollY) + 'px'); }; fit(); addEventListener('resize', fit); return () => removeEventListener('resize', fit); }, []);
  const M = SM?.display || {}, s = PB?.strategy && !PB.strategy.error ? PB.strategy : null, S = H?.days?.length ? summarize(H.days) : null;
  const chg = M.change24h ? (M.change24hPositive ? '+' : '−') + M.change24h.replace('-', '') + ' 24H' : '';
  const pool = s?.stockInPool, fee = s ? Math.max(0, s.stockInPool - s.curveStock) : null, f = F8?.latest, t = T?.totals || {};
  const run = raw => {
    const c = raw.trim().toLowerCase().replace(/\s+/g, ' '); let out;
    switch (c) {
      case '': out = []; break;
      case 'help': case '?': out = HELP; break;
      case 'stack': out = ['BTC → MSTR → $STRATEGY', ['STRATEGY₿ INC. HOLDS ', num(f?.btcHeld) + ' BTC'], ['THE POOL HOLDS ', num(pool) + ' MSTR'], ['EVERY 1M $STRATEGY: ', n2(pool != null ? pool / 1e3 : null) + ' MSTR']]; break;
      case 'price': out = [['$STRATEGY ', (M.priceUsd || '—') + (chg ? '  ' + chg : '')], ['MARKET CAP ', M.marketCap || '—'], ['24H VOLUME ', M.volume24h || '—'], ['HOLDERS ', M.holders || '—']]; break;
      case 'pool': out = [['MSTR IN POOL ', num(pool)], ['· LOCKED LAUNCH LIQUIDITY ', num(s ? pool - fee : null)], ['· COMPOUNDED BY FEES ', num(fee)], ['MSTR YIELD 30D ', pc(S?.yield30d)], 'PART OF EVERY FEE GOES BACK IN. THE FLOOR ONLY RISES.']; break;
      case 'mstr': out = [['MSTR TOKENS ON-CHAIN ', num(t.circ)], ['WORTH ', fmt(t.mcap)], ['TRADED WHILE NASDAQ IS CLOSED ', OH?.all?.d30?.closedPct != null ? Math.round(OH.all.d30.closedPct) + '% (30D)' : '—'], 'MORE: /MSTR']; break;
      case '8k': out = f ? [['LATEST 8-K FILED ', dt(f.filingDate)], ['STRATEGY₿ INC. HOLDS ', num(f.btcHeld) + ' BTC'], ['CHANGE ', (F8.weeklyChangeBtc >= 0 ? '+' : '') + num(F8.weeklyChangeBtc) + ' BTC'], { href: f.doc, t: 'OPEN THE FILING ↗' }] : ['NO FILING LOADED. TRY AGAIN SOON.']; break;
      case 'buy': case 'sell': setLog(l => [...l.slice(-80), { c: raw.trim(), out: [] }]); exe.start(c); return;
      case 'ca': copyText(ADDR.STRATEGY); out = [['$STRATEGY ', ADDR.STRATEGY], ['MSTR (ROBINHOOD) ', ADDR.MSTR], 'COPIED $STRATEGY TO CLIPBOARD.']; break;
      case 'gm': out = ['GM. MSTR TRADES 24/7 ON-CHAIN. NASDAQ IS CLOSED.', 'HOLD. HOLD. AMPLIFY.']; break;
      case 'gn': out = ['GN. THE POOL DOES NOT SLEEP.']; break;
      case 'saylor': out = ['THERE IS NO SECOND BEST.']; break;
      case 'wagmi': out = ['WE ARE ALL GONNA MAKE IT.', 'NOT FINANCIAL ADVICE.']; break;
      case '21m': out = ['21,000,000 BTC. NO MORE.', '1,000,000,000 $STRATEGY. NO MORE.']; break;
      case 'laser eyes': case 'lasereyes': setLaser(v => !v); out = ['LASER EYES: ' + (laser ? 'OFF' : 'ON')]; break;
      case 'wen moon': case 'wen': out = ['NOT FINANCIAL ADVICE. HOLD. HOLD. AMPLIFY.']; break;
      case 'sudo': case 'sudo su': out = ['NICE TRY.']; break;
      case 'ls': case 'dir': out = ['AMPLIFIED_MSTR.EXE   README.TXT   RESERVE/ (EMPTY. COMING SOON.)']; break;
      case 'cat readme.txt': case 'type readme.txt': out = ['$STRATEGY IS PAIRED WITH TOKENIZED MSTR.', 'IF MSTR IS AMPLIFIED BITCOIN, $STRATEGY IS AMPLIFIED MSTR.', 'THAT’S THE STRATEGY.']; break;
      case 'clear': case 'cls': setLog([]); return;
      case 'exit': case 'eject': out = ['EJECTING...']; setTimeout(() => document.querySelector('.term-side .eject')?.click(), 350); break;
      default: out = ['BAD COMMAND OR FILE NAME. TRY HELP.'];
    }
    setLog(l => [...l.slice(-60), { c: raw.trim(), out }]);
  };
  const booted = useRef(false);
  useEffect(() => { if (!booted.current && pool != null) { booted.current = true; run('stack'); } }, [pool]); // first answer once live numbers are in
  useEffect(() => { if (matchMedia('(pointer: fine)').matches) inp.current?.focus({ preventScroll: true }); }, []); // no keyboard pop-up on phones
  useEffect(() => { if (scr.current) scr.current.scrollTop = scr.current.scrollHeight; }, [log]);
  const submit = e => { e.preventDefault(); exe.active ? exe.answer(cmd) : run(cmd); if (cmd.trim()) setHist(h => ({ list: [...h.list, cmd], i: -1 })); setCmd(''); };
  const key = e => {
    if (e.key === 'Escape' && exe.active) { e.preventDefault(); setLog(l => [...l.slice(-80), { p: exe.prompt, c: 'ESC', out: [] }]); exe.quit(); setCmd(''); return; }
    if (e.key === 'ArrowUp' && hist.list.length) { e.preventDefault(); const i = hist.i < 0 ? hist.list.length - 1 : Math.max(0, hist.i - 1); setHist({ ...hist, i }); setCmd(hist.list[i]); }
    if (e.key === 'ArrowDown' && hist.i >= 0) { e.preventDefault(); const i = hist.i + 1; if (i >= hist.list.length) { setHist({ ...hist, i: -1 }); setCmd(''); } else { setHist({ ...hist, i }); setCmd(hist.list[i]); } }
  };
  const line = (x, i) => typeof x === 'string' ? <div key={i}>{x}</div> : x.key ? <div key={i}><span className="inv">{x.key}</span> {x.t} <span className="dim">{x.d}</span></div> : x.big ? <div key={i} className="hi" style={{ fontSize: '1.4em', margin: '4px 0' }}>{x.big}</div> : x.href ? <div key={i}><a href={x.href} target="_blank" rel="noopener">{x.t}</a></div> : <div key={i}><span className="dim">{x[0]}</span><span className="hi">{x[1]}</span></div>;
  return (<div className="term-room" ref={room}>
    <div className="term-case">
      <div className="term-top"><div><div className="term-badge">$STRATEGY</div><div className="term-model">STRATEGY COIN / MODEL 4926</div></div>
        <div className="term-leds" aria-hidden="true"><span><i className={'led' + (SM ? ' on' : '')} />RPC</span><span><i className="led" />WALLET</span><span><i className={'led' + (s ? ' on' : '')} />LP</span><span><i className={'led' + (SM && SM.ok !== false ? ' on' : '')} />LIVE</span></div>
        <div className="term-grille" aria-hidden="true" /></div>
      <div className="term-body">
        <div className="term-bezel"><div className={'term-crt' + (laser ? ' laser' : '') + (on ? '' : ' off')} style={{ filter: `brightness(${[0.7, 1, 1.25][bright]})` }} onClick={() => inp.current?.focus({ preventScroll: true })}>
          {on && <Mark className="term-mark" />}
          {on ? <>
            <div className="dim">$STRATEGY BIOS v4.926 · ROBINHOOD CHAIN · LINK {SM ? 'OK' : '...'}</div>
            <div className="dim" style={{ marginBottom: 12 }}>TYPE <span className="hi">HELP</span> FOR COMMANDS.</div>
            <div className="term-split">
              <div className="term-log" ref={scr} aria-live="polite">
                {log.map((e, i) => <div key={e.id || i} style={{ marginBottom: e.p ? 2 : 10 }}>{e.c != null && <div><span className="dim">{e.p || P}</span> <span className="you">{e.c}</span></div>}{e.out.length > 0 && <div className={e.box ? 'term-box' : ''} style={{ paddingLeft: e.c != null || e.box ? 16 : 0 }}>{e.out.map(line)}</div>}</div>)}
                <form onSubmit={submit} className="term-prompt"><label htmlFor="term-in" className="dim">{exe.prompt || P}</label>&nbsp;<span className="you">{cmd}</span><span className="term-cursor" aria-hidden="true" />
                  <input id="term-in" ref={inp} value={cmd} onChange={e => setCmd(e.target.value)} onKeyDown={key} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} enterKeyHint="send" aria-label="Type a command" maxLength={60} /></form>
              </div>
              <div>
                <div className="term-box"><h2>$STRATEGY</h2><div className="term-row" style={{ alignItems: 'flex-end' }}><span className="hi" style={{ fontSize: 44, lineHeight: 1 }}>{M.priceUsd || '—'}</span><span>{chg}</span></div></div>
                <div className="term-box">{[['MARKET CAP', M.marketCap || '—', 1], ['MSTR IN POOL', num(pool), 1], ['LP TOTAL $', M.liquidityUsd || '—'], ['24H VOLUME', M.volume24h || '—'], ['HOLDERS', M.holders || '—'], ['RESERVE', 'COMING SOON']].map(([k, v, h]) => <div key={k} className="term-row"><span className="dim">{k}</span><span className={h ? 'hi' : ''}>{v}</span></div>)}</div>
              </div>
            </div>
            <div className="term-tick dim" aria-hidden="true"><div>{[0, 1].map(k => <span key={k}>BTC → MSTR → $STRATEGY // STRATEGY₿ INC. HOLDS {num(f?.btcHeld)} BTC // {num(t.circ)} MSTR TOKENS ON-CHAIN // {OH?.all?.d30?.closedPct != null ? Math.round(OH.all.d30.closedPct) : '—'}% OF MSTR VOLUME TRADED WHILE NASDAQ IS CLOSED // HOLD. HOLD. AMPLIFY. // </span>)}</div></div>
          </> : <div className="term-nosignal">NO SIGNAL</div>}
        </div></div>
        <div className="term-side">
          <div className="ctl"><div className="slot" aria-hidden="true"><i /></div>DISK</div>
          <div className="ctl"><button type="button" className="knob" style={{ transform: `rotate(${(bright - 1) * 60}deg)` }} onClick={() => setBright(b => (b + 1) % 3)} aria-label={'Brightness: ' + ['dim', 'normal', 'bright'][bright]} />BRIGHT</div>
          <div className="ctl"><button type="button" className="key" onClick={async () => { await copyText(ADDR.STRATEGY); setCopied(true); setTimeout(() => setCopied(false), 1600); }} aria-label="Copy $STRATEGY contract address" />{copied ? 'COPIED' : 'CA'}</div>
          <div className="ctl"><a className="eject" href="/strategy/" aria-label="Eject: back to the $STRATEGY page" />EJECT</div>
          <div className="ctl term-power"><button type="button" className="power" onClick={() => setOn(v => !v)} aria-pressed={on} aria-label={on ? 'Power off the screen' : 'Power on the screen'} />POWER</div>
        </div>
      </div>
    </div>
    </div>);
}
