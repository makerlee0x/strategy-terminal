'use client';
// BUY.EXE / SELL.EXE: buying and selling $STRATEGY inside the terminal, one prompt at a time.
// Same engine as the swap window (lib/swap.js). Add ?mock=1 to the page for a demo run with no wallet.
import { useRef, useState } from 'react';
import { ETH, MSTR, STRAT, ZERO, toUnits, fromUnits, fmtN, usd, balanceOf, connectInjected, connectWC, getQuote, runSwap, DEFAULT_FEE_BPS } from '../../lib/swap';
const FOMO = 'https://fomo.family/coin?address=0x168661c52e5922288dfb2b3f323b6cf90eb21e18&chainId=4663&r=0xmakerlee&source=share_link';
const LONG = 'https://app.long.xyz/tokens/0x168661c52e5922288dfb2b3f323b6cf90eb21e18';
const TX = h => 'https://robinhoodchain.blockscout.com/tx/' + h;
const sym = t => t.symbol;
const short = a => a.slice(0, 6) + '…' + a.slice(-4);
const GAS = 150000000000000n; // ETH kept back for gas on MAX
const MOCK = { receiveAmount: '53491.27', payAmountUsd: '124.61', receiveAmountUsd: '99.62', routeLabels: ['Relay', 'Uniswap v4'], fees: { totalImpactPct: '4.20' } };
const bar = p => ['BROADCASTING  ', '█'.repeat(Math.round(p / 6.25)) + '░'.repeat(16 - Math.round(p / 6.25)) + ' ' + p + '%'];
const sleep = ms => new Promise(r => setTimeout(r, ms));

export function useBuyExe(setLog) {
  const S = useRef({ step: null, slip: 2 }), [prompt, setPrompt] = useState(null);
  const say = (out, extra = {}) => { const id = Math.random(); setLog(l => [...l.slice(-80), { id, out, ...extra }]); return id; };
  const upd = (id, out) => setLog(l => l.map(e => e.id === id ? { ...e, out } : e));
  const ask = (step, p) => { S.current.step = step; setPrompt(p); };
  const end = () => { S.current.step = null; setPrompt(null); };
  const mock = () => typeof location !== 'undefined' && /[?&]mock=1/.test(location.search);
  const name = () => S.current.side === 'sell' ? 'SELL.EXE' : 'BUY.EXE';

  function start(side) {
    Object.assign(S.current, { side, pay: null, recv: null, amt: null, quote: null });
    say(['LOADING ' + (side === 'sell' ? 'SELL' : 'BUY') + '.EXE ........ OK', 'BACK · CLEAR · Q OR ESC TO QUIT']);
    if (side === 'sell') return goWallet();
    menu();
  }
  function menu() {
    say(['BUY $STRATEGY', { key: '1', t: 'SWAP HERE', d: 'ETH OR MSTR → $STRATEGY, IN THIS TERMINAL' }, { key: '2', t: 'FOMO', d: 'FOMO.FAMILY ↗' }, { key: '3', t: 'LONG', d: 'APP.LONG.XYZ ↗' }, { key: '4', t: 'LEVERAGE', d: 'COMING SOON' }, { key: 'Q', t: 'QUIT', d: '' }], { box: true });
    ask('menu', 'SELECT [1-4]>');
  }
  function quit() { if (S.current.step === 'busy') return say(['PLEASE WAIT.']); say([name() + ' CLOSED.']); end(); }
  const askPay = () => ask('pay', S.current.side === 'sell' ? 'RECEIVE [ETH/MSTR]>' : 'PAY WITH [ETH/MSTR]>');
  const askAmount = () => ask('amount', `AMOUNT IN ${sym(S.current.pay)} (OR MAX)>`);
  // One step back. From the first step, back closes the program.
  function back() {
    const s = S.current, first = () => { if (s.side === 'sell') return quit(); say(['BACK TO THE MENU.']); return menu(); };
    switch (s.step) {
      case 'menu': return quit();
      case 'wallet': return first();
      case 'pay': return first();
      case 'amount': say(['BACK.']); return askPay();
      case 'confirm': say(['BACK. QUOTE DISCARDED.']); return askAmount();
      case 'busy': return say(['PLEASE WAIT.']);
    }
  }
  async function goWallet() {
    const s = S.current;
    if (!s.acct && mock()) s.acct = '0x7a3F00000000000000000000000000000091c2';
    if (s.acct) return walletReady();
    say(['CONNECT A WALLET', { key: '1', t: 'BROWSER WALLET', d: 'METAMASK, RABBY, ROBINHOOD WALLET' }, { key: '2', t: 'WALLETCONNECT', d: 'SCAN WITH A PHONE WALLET' }], { box: true });
    ask('wallet', 'WALLET [1/2]>');
  }
  async function walletReady() {
    const s = S.current; let bal = '1.2400';
    if (!mock()) try { bal = fmtN(fromUnits(await balanceOf(ETH, s.acct), 18)); } catch (e) { bal = '—'; }
    say([['WALLET ', short(s.acct) + ' · ROBINHOOD CHAIN · ' + bal + ' ETH']]);
    askPay();
  }
  async function quote() {
    const s = S.current;
    const id = say(['FETCHING QUOTE ...']);
    try {
      if (mock()) { await sleep(600); s.quote = MOCK; } else s.quote = (await getQuote({ acct: s.acct, payTok: s.pay, recvTok: s.recv, w: s.w, slip: s.slip })).quote;
    } catch (e) { upd(id, ['QUOTE FAILED: ' + String(e.message || e).toUpperCase()]); return askAmount(); }
    const q = s.quote, imp = Number(q.fees?.totalImpactPct ?? q.fees?.swapImpactPct);
    const feeUsd = q.fees?.interfaceFeeUsd != null ? usd(q.fees.interfaceFeeUsd) : q.payAmountUsd != null ? '~' + usd(q.payAmountUsd * (q.fees?.interfaceFeeBps ?? DEFAULT_FEE_BPS) / 1e4) : '—';
    upd(id, ['QUOTE · ' + (q.routeLabels || ['RELAY']).join(' · ').toUpperCase()]);
    say([['YOU PAY       ', s.amt + ' ' + sym(s.pay) + (q.payAmountUsd ? ' (≈' + usd(q.payAmountUsd) + ')' : '')], ['YOU GET       ', (s.recv === STRAT ? Math.floor(Number(q.receiveAmount)).toLocaleString('en-US') : fmtN(q.receiveAmount)) + ' ' + sym(s.recv)], ['MIN AFTER ' + s.slip + '% SLIPPAGE  ', Math.floor(Number(q.receiveAmount) * (1 - s.slip / 100)).toLocaleString('en-US')],
      ['PRICE IMPACT  ', Number.isFinite(imp) ? imp + '%' + (imp >= 3 ? ' ⚠ HIGH' : '') : '—'], ['SOLVER FEE    ', feeUsd]], { box: true });
    if (imp >= 3) say(['HIGH PRICE IMPACT: YOU MAY GET MUCH LESS THAN MARKET VALUE. TRY A SMALLER AMOUNT.']);
    say(['TYPE SLIP 5 TO CHANGE SLIPPAGE.']);
    ask('confirm', 'EXECUTE? [Y/N]>');
  }
  async function execute() {
    const s = S.current, q = s.quote; ask('busy', 'WORKING>');
    const id = say(['CONFIRM IN YOUR WALLET ...']); let barId = null, tx = null, ok;
    try {
      if (mock()) {
        await sleep(900); upd(id, ['SIGNED.']); tx = '0x9c41000000000000000000000000000000000000000000000000000000e7a0'; barId = say([bar(0)]);
        for (let p = 12; p <= 100; p += 11) { await sleep(260); upd(barId, [bar(Math.min(p, 100))]); } upd(barId, [bar(100)]); ok = true;
      } else {
        const r = await runSwap({ prov: s.prov, acct: s.acct, payTok: s.pay, recvTok: s.recv, w: s.w, slip: s.slip, quote: q }, (m, k, x = {}) => {
          if (x.phase === 'sent') { tx = x.tx; upd(id, ['SIGNED. TX ' + short(x.tx)]); if (!barId) barId = say([bar(5)]); }
          if (x.phase === 'settle' && barId) upd(barId, [bar(Math.min(95, Math.round(100 * (1 - Math.exp(-(x.i + 1) / 5)))))]);
          if (x.phase === 'done' && barId) upd(barId, [bar(100)]);
        });
        ok = r.ok; tx = r.tx || tx;
      }
    } catch (e) { say(['✗ ' + String(e.message || 'SWAP FAILED.').toUpperCase(), 'NOTHING WAS SENT.']); return end(); }
    if (ok) say([{ big: '✓ ' + (s.side === 'sell' ? 'SOLD ' + s.amt + ' $STRATEGY' : 'BOUGHT ' + Math.floor(Number(q.receiveAmount)).toLocaleString('en-US') + ' $STRATEGY') }, ...(tx ? [{ href: TX(tx), t: 'TX ' + short(tx) + ' · VIEW ON EXPLORER ↗' }] : []), 'HOLD. HOLD. AMPLIFY.']);
    else if (ok === false) say(['✗ SWAP FAILED.', ...(tx ? [{ href: TX(tx), t: 'CHECK THE EXPLORER ↗' }] : [])]);
    else say(['STILL SETTLING.', ...(tx ? [{ href: TX(tx), t: 'CHECK THE EXPLORER ↗' }] : [])]);
    end();
  }
  async function answer(raw) {
    const s = S.current, a = raw.trim().toLowerCase();
    setLog(l => [...l.slice(-80), { p: prompt, c: raw.trim(), out: [] }]);
    if (s.step === 'busy') return say(['PLEASE WAIT.']);
    if (['q', 'quit', 'exit', 'cancel', 'esc'].includes(a)) return quit();
    if (a === 'back' || a === 'b') return back();
    if (a === 'clear' || a === 'cls') return setLog([]);
    if (a === 'help' || a === '?') return say(['BACK · CLEAR · Q OR ESC TO QUIT']);
    if (s.step === 'menu') {
      if (a === '1') return goWallet();
      if (a === '2' || a === '3') { const [u, n] = a === '2' ? [FOMO, 'FOMO.FAMILY'] : [LONG, 'APP.LONG.XYZ']; window.open(u, '_blank', 'noopener'); say(['OPENING ' + n + ' ...', { href: u, t: 'IF NOTHING OPENED: ' + n + ' ↗' }]); return end(); }
      if (a === '4') return say(['LEVERAGE IS COMING SOON, ON ANOTHER PLATFORM. PICK 1-3 OR Q.']);
      return say(['PICK 1-4, OR Q TO QUIT.']);
    }
    if (s.step === 'wallet') {
      if (a !== '1' && a !== '2') return say(['TYPE 1 OR 2, OR Q TO QUIT.']);
      const id = say(['CONNECTING WALLET ...']);
      try { const w = await (a === '1' ? connectInjected() : connectWC()); s.prov = w.prov; s.acct = w.acct; upd(id, ['CONNECTED.']); return walletReady(); }
      catch (e) { upd(id, ['CONNECT FAILED: ' + String(e.message || e).toUpperCase()]); return; }
    }
    if (s.step === 'pay') {
      if (a !== 'eth' && a !== 'mstr') return say(['TYPE ETH OR MSTR.']);
      const t = a === 'eth' ? ETH : MSTR;
      if (s.side === 'sell') { s.pay = STRAT; s.recv = t; } else { s.pay = t; s.recv = STRAT; }
      s.bal = null; if (!mock()) balanceOf(s.pay, s.acct).then(b => { s.bal = b; }).catch(() => {});
      return askAmount();
    }
    if (s.step === 'amount') {
      let v = a;
      if (a === 'max') { if (mock()) v = '1.19'; else if (s.bal == null) return say(['BALANCE NOT LOADED YET. TYPE AN AMOUNT.']); else { let b = s.bal; if (s.pay.address === ZERO) b = b > GAS ? b - GAS : 0n; v = fromUnits(b, s.pay.decimals); } }
      const w = toUnits(v, s.pay.decimals);
      if (!w || w === '0') return say(['TYPE A NUMBER, LIKE 0.05.']);
      s.amt = v; s.w = w; return quote();
    }
    if (s.step === 'confirm') {
      const m = a.match(/^slip\s+(\d+(\.\d+)?)%?$/);
      if (m) { const n = Number(m[1]); if (!(n > 0 && n < 50)) return say(['SLIPPAGE MUST BE BETWEEN 0 AND 50.']); s.slip = n; say(['SLIPPAGE SET TO ' + n + '%.']); return quote(); }
      if (a === 'y' || a === 'yes') return execute();
      if (a === 'n' || a === 'no') { say(['CANCELLED. NOTHING WAS SENT.']); return end(); }
      return say(['TYPE Y OR N.']);
    }
  }
  return { prompt, start, answer, quit, active: prompt != null };
}
