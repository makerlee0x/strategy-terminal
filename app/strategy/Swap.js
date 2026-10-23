'use client';
import {useEffect,useRef,useState} from 'react';
import {DEFAULT_FEE_BPS,ZERO,ETH,MSTR,STRAT,ETH_L1,BUY_PAY_TOKENS,SELL_RECV_TOKENS,CHAIN_NAME,tokenKey,tokLabel,isStable,toUnits,fmtN,usd,call,balanceOf,fromUnits,connectInjected as cInj,connectWC as cWC,swapBody,feeLine,runSwap} from '../../lib/swap';
const MOCK={receiveAmount:'53491.27',payAmount:'0.05',payAmountUsd:'124.61',receiveAmountUsd:'99.62',routeLabels:['Relay','Uniswap v4'],fees:{totalImpactPct:'4.20',interfaceFeeBps:DEFAULT_FEE_BPS}};
const PRESETS={buyEth:['0.01','0.05','0.1','0.5'],buyUsd:['25','100','250','500'],sell:['1000','10000','100000','MAX'],bridge:['0.005','0.01','0.02','0.05']};
const byKey=Object.fromEntries(BUY_PAY_TOKENS.map(t=>[tokenKey(t),t]));
const sellByKey=Object.fromEntries(SELL_RECV_TOKENS.map(t=>[tokenKey(t),t]));
const groupPay=()=>{const g={};for(const t of BUY_PAY_TOKENS){(g[CHAIN_NAME[t.chainId]||t.chainId]||=[]).push(t)}return g};

export default function Swap({mock, initialMode='buy'}){
 const [mode,setMode]=useState(initialMode==='gas'||initialMode==='bridge'?'bridge':initialMode);
 const [pay,setPay]=useState(ETH),[amt,setAmt]=useState(mock?'0.05':''),[slip,setSlip]=useState(2),[custom,setCustom]=useState('');
 const [acct,setAcct]=useState(null),[prov,setProv]=useState(null),[quote,setQuote]=useState(mock?MOCK:null);
 const [status,setStatus]=useState(mock?['Sample quote — illustrative only','ok']:['','']);
 const [busy,setBusy]=useState(false),[picker,setPicker]=useState(false),[bal,setBal]=useState(null),[gasBal,setGasBal]=useState(null);
 const payTok=mode==='buy'?pay:mode==='sell'?STRAT:ETH_L1;
 const sellTo=mode==='sell'?(SELL_RECV_TOKENS.find(t=>tokenKey(t)===tokenKey(pay))||ETH):null;
 const recvTok=mode==='sell'?sellTo:mode==='buy'?STRAT:ETH;
 const body=w=>swapBody({acct,payTok,recvTok,w,slip});
 const t=useRef();
 const chips=mode==='bridge'?PRESETS.bridge:mode==='sell'?PRESETS.sell:isStable(payTok)?PRESETS.buyUsd:PRESETS.buyEth;
 useEffect(()=>{if(mock)return;setQuote(null);clearTimeout(t.current);if(!amt)return setStatus(['','']);if(!acct)return setStatus(['Connect a wallet for a live quote.','info']);const w=toUnits(amt,payTok.decimals);if(!w||w==='0')return setStatus(['Invalid amount.','error']);
  t.current=setTimeout(async()=>{setStatus(['Finding best route…','working']);try{const y=await call('/api/swap/quote',{method:'POST',body:JSON.stringify(body(w))});if(y.swapsEnabled===false)return setStatus([y.note||'Swaps temporarily unavailable.','error']);setQuote(y.quote);const route=(y.quote?.routeLabels||[]).join(' · ');setStatus([route?('Best route · '+route): (y.note||'Best rate locked in.'), 'ok'])}catch(e){setStatus([e.message||'Quote failed.','error'])}},450);return()=>clearTimeout(t.current)},[amt,mode,pay,slip,acct]);
 function adopt({prov:p,acct:a}){setProv(p);setAcct(a);setPicker(false);p.on?.('accountsChanged',x=>setAcct(x?.[0]||null))}
 async function connectInjected(){try{adopt(await cInj())}catch(e){setStatus([e.message||'Connect failed.','error'])}}
 async function connectWC(){try{setStatus(['Opening WalletConnect…','working']);adopt(await cWC());setStatus(['',''])}catch(e){setStatus([e.message||'WalletConnect failed.','error'])}}
 function connect(){if(acct)return;setPicker(v=>!v)}
 function setTab(m){setMode(m);setPay(ETH);setAmt(m==='bridge'?'0.01':'');setQuote(null);setStatus(['',''])}
 useEffect(()=>{if(!acct||mock)return setBal(null);let on=true;balanceOf(payTok,acct).then(b=>on&&setBal(b)).catch(()=>on&&setBal(null));return()=>{on=false}},[acct,mode,pay,status[0]==='Success ✓']);
 useEffect(()=>{if(!acct||mock)return setGasBal(null);let on=true;balanceOf(ETH,acct).then(b=>on&&setGasBal(b)).catch(()=>on&&setGasBal(null));return()=>{on=false}},[acct,status[0]==='Success ✓',mode]);
 async function execute(){if(mock||!acct||!quote)return;const w=toUnits(amt,payTok.decimals);setBusy(true);setStatus(['Preparing…','working']);try{await runSwap({prov,acct,payTok,recvTok,w,slip,quote},(m,k)=>setStatus([m,k]))}catch(e){setStatus([e.message||'Swap failed.','error'])}finally{setBusy(false)}}
 const impact=quote?Number(quote.fees?.totalImpactPct??quote.fees?.swapImpactPct):null;const min=quote?Number(quote.receiveAmount)*(1-slip/100):null;const rate=quote&&Number(amt)>0?Number(quote.receiveAmount)/Number(amt):null;
 const label=!acct&&!mock?'Connect wallet':!amt?'Enter amount':!quote?'Finding best rate…':mode==='bridge'?'Bridge gas':mode==='sell'?'Sell $STRATEGY':'Buy $STRATEGY';
 const gasEth=gasBal!=null?Number(fromUnits(gasBal,18)):null;
 const lowGas=acct&&!mock&&gasEth!=null&&gasEth<0.002&&mode!=='bridge';
 const blurb=mode==='bridge'
  ?'Bridge a little ETH from Ethereum → Robinhood Chain for gas. Takes seconds.'
  :mode==='sell'
  ?'Sell $STRATEGY for ETH or MSTR. Routed for the best available rate.'
  :'Pay with ETH, USDG, USDC, or MSTR — Robinhood or cross-chain. Best available rate.';
 const payGroups=groupPay();
 return <div className="sw">
  <p className="sw-blurb">{blurb}</p>
  <div className="sw-top"><div className="seg" role="tablist">
   {[['buy','Buy'],['sell','Sell'],['bridge','Get gas']].map(([m,l])=><button key={m} role="tab" aria-selected={mode===m} className={mode===m?'on':''} onClick={()=>setTab(m)}>{l}</button>)}
  </div>
  <button className="sw-wallet" onClick={connect} aria-expanded={picker}>{acct?acct.slice(0,6)+'…'+acct.slice(-4):mock?'0x7a3F…91c2':'Connect wallet'}</button></div>
  {picker&&!acct&&<div className="sw-picker"><button className="mopt" onClick={connectInjected}><b>Browser wallet</b><span className="k">MetaMask, Rabby, Robinhood Wallet…</span></button><button className="mopt" onClick={connectWC}><b>WalletConnect</b><span className="k">Scan with a mobile wallet</span></button></div>}
  {lowGas&&<div className="sw-hint" role="status"><span>Low ETH for gas on Robinhood Chain{gasEth!=null?' · '+fmtN(gasEth)+' ETH':''}.</span><button type="button" className="linkbtn" onClick={()=>setTab('bridge')}>Get gas →</button></div>}
  <div className="sw-tool"><span className="k">{mode==='bridge'?'ETH L1 → ETH on Robinhood':mode==='sell'?'Best rate out':'Best rate in'}</span>
  <div className="slip"><span className="k">Slippage</span>{[2,10,15].map(s=><button key={s} className={slip===s&&!custom?'on':''} onClick={()=>{setSlip(s);setCustom('')}}>{s}%</button>)}<input aria-label="Custom slippage %" placeholder="custom" value={custom} inputMode="decimal" onChange={e=>{setCustom(e.target.value);const n=Number(e.target.value);if(n>0&&n<50)setSlip(n)}}/></div></div>
  <div className="sw-card"><div className="sw-row"><span className="k">You pay · {CHAIN_NAME[payTok.chainId]||('Chain '+payTok.chainId)}</span><span className="k">Bal {mock?'1.2400':bal!=null?fmtN(fromUnits(bal,payTok.decimals)):'—'} {(bal!=null||mock)&&<button className="linkbtn" onClick={()=>{if(mock){setAmt(mode==='bridge'?'0.01':isStable(payTok)?'100':'0.05');return}let b=bal;if(payTok.address===ZERO){const gas=150000000000000n;b=b>gas?b-gas:0n}setAmt(fromUnits(b,payTok.decimals))}}>MAX</button>}</span></div>
   <div className="sw-row"><input className="sw-amt" aria-label="Amount" inputMode="decimal" placeholder="0.0" value={amt} onChange={e=>setAmt(e.target.value.replace(/[^0-9.]/g,''))}/>
   {mode==='buy'?<select aria-label="Pay token" value={tokenKey(pay)} onChange={e=>{const t=byKey[e.target.value];if(t){setPay(t);setAmt('');setQuote(null)}}}>{Object.entries(payGroups).map(([g,toks])=><optgroup key={g} label={g}>{toks.map(t=><option key={tokenKey(t)} value={tokenKey(t)}>{tokLabel(t)}</option>)}</optgroup>)}</select>:mode==='bridge'?<span className="tok">ETH</span>:<span className="tok">{payTok.symbol}</span>}</div>
   <div className="sw-row"><span className="k">{quote?'~'+usd(quote.payAmountUsd):'—'}</span><span className="chips">{chips.map(v=><button key={v} onClick={()=>{if(v==='MAX'){if(mock)return setAmt('10000');if(bal==null)return;let b=bal;if(payTok.address===ZERO){const gas=150000000000000n;b=b>gas?b-gas:0n}setAmt(fromUnits(b,payTok.decimals))}else setAmt(v)}}>{v}</button>)}</span></div></div>
  <div className="sw-arrow" aria-hidden>↓</div>
  <div className="sw-card"><div className="sw-row"><span className="k">You receive</span><span className="k">Robinhood Chain</span></div>
   <div className="sw-row"><span className="stamp" style={{fontSize:34,margin:0}}>{quote?fmtN(quote.receiveAmount):'—'}</span>{mode==='sell'?<select aria-label="Receive token" value={tokenKey(pay)} onChange={e=>{const t=sellByKey[e.target.value];if(t)setPay(t)}}>{SELL_RECV_TOKENS.map(t=><option key={tokenKey(t)} value={tokenKey(t)}>{t.symbol}</option>)}</select>:<span className="tok">{recvTok.symbol}</span>}</div>
   <div className="sw-row"><span className="k">{quote?'~'+usd(quote.receiveAmountUsd):'—'}</span><span className="k">{payTok.symbol} → {recvTok.symbol}</span></div></div>
  {quote&&<table className="sw-meta"><tbody>
   <tr><td>Best rate</td><td>1 {payTok.symbol} = {fmtN(rate)} {recvTok.symbol}</td></tr>
   <tr><td>Min. received ({slip}%)</td><td>{fmtN(min)} {recvTok.symbol}</td></tr>
   <tr><td>Price impact</td><td>{quote.fees?.totalImpactPct??quote.fees?.swapImpactPct??'—'}%</td></tr>
   <tr><td>Route</td><td>{(quote.routeLabels||['Relay']).join(' · ')}</td></tr>
   <tr><td>Solver fee</td><td>{feeLine(quote)}</td></tr></tbody></table>}
  {impact!=null&&impact>=3&&<div className="sw-warn" role="alert">{impact>=10?'⚠ Very high':'⚠ High'} price impact ({impact}%). You may receive much less than market value. Try a smaller amount.</div>}
  <button className="sw-go" disabled={mock||busy||!(acct&&quote&&amt)} onClick={execute}>{label}</button>
  <div className={'sw-status '+status[1]} role="status" aria-live="polite">{mock&&<span className="tag sample" style={{marginRight:8}}>SAMPLE</span>}{status[0]}</div>
  {mode!=='bridge'&&<p className="sw-foot">No ETH for gas? <button type="button" className="linkbtn" onClick={()=>setTab('bridge')}>Get gas</button> — bridge a little ETH from Ethereum in one click.</p>}
  {mode==='bridge'&&<p className="sw-foot">After it lands, flip back to <button type="button" className="linkbtn" onClick={()=>setTab('buy')}>Buy</button> and grab $STRATEGY.</p>}
 </div>}
