'use client';
import {useEffect,useRef,useState} from 'react';import Swap from './Swap';
const CA='0x168661c52e5922288dfb2b3f323b6cf90eb21e18',MSTR='0xec262a75e413fafd0df80480274532c79d42da09';
const FOMO='https://fomo.family/coin?address=0x168661c52e5922288dfb2b3f323b6cf90eb21e18&chainId=4663&r=0xmakerlee&source=share_link';
const LONG='https://app.long.xyz/tokens/'+CA;
const UNI=`https://app.uniswap.org/swap?chain=robinhood&inputCurrency=${MSTR}&outputCurrency=${CA}`;
export async function copyText(v){try{await navigator.clipboard.writeText(v)}catch(e){const t=document.createElement('textarea');t.value=v;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}}
/** Labelled, shortened address chip with a copy button (hero). */
export function CopyAddr({label,addr,light}){const [c,setC]=useState(false);return <button type="button" className={'addrchip'+(light?' light':'')} onClick={async()=>{await copyText(addr);setC(true);setTimeout(()=>setC(false),1600)}} aria-label={'Copy '+label+' contract address'} title={addr}><span className="lbl">{label}</span><span>{addr.slice(0,6)+'…'+addr.slice(-4)}</span><span className="cp">{c?'COPIED ✓':'COPY'}</span></button>}
export const ADDR={STRATEGY:CA,MSTR};
export function CopyCA(){const [c,setC]=useState(false);return <button className="addr cabtn" onClick={async()=>{try{await navigator.clipboard.writeText(CA)}catch(e){const t=document.createElement('textarea');t.value=CA;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}setC(true);setTimeout(()=>setC(false),1600)}} aria-label="Copy contract address">{c?'COPIED ✓':'CA '+CA+'  ⧉'}</button>}
function Modal({title,kicker,onClose,children}){const ref=useRef();useEffect(()=>{const k=e=>e.key==='Escape'&&onClose();document.addEventListener('keydown',k);const prev=document.activeElement;ref.current?.focus();document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',k);document.body.style.overflow='';prev?.focus?.()}},[onClose]);
return <div className="mback" onClick={onClose}><div className="mcard" role="dialog" aria-modal="true" aria-labelledby="mtitle" tabIndex={-1} ref={ref} onClick={e=>e.stopPropagation()}>
<div className="mstampx" aria-hidden="true">ROBINHOOD CHAIN</div><div className="mhead"><img src="/strategy-icon.png" alt="" width="34" height="34"/><div style={{flex:1}}><div className="k">{kicker}</div><div id="mtitle" className="d" style={{fontSize:24}}>{title}</div></div><button className="mx" onClick={onClose} aria-label="Close">×</button></div><div className="mbody">{children}</div></div></div>}
function Buy({toSwap,toGas}){return <><p className="sub" style={{marginTop:0}}>Pick a path. Best rates route through Relay + Uniswap on Robinhood Chain.</p>
{[['01','Swap here','Best available rate · ETH or MSTR → $STRATEGY',null,toSwap,'Live quote'],['02','Get gas','Bridge a little ETH for Robinhood gas',null,toGas,'ETH L1 → RH'],['03','Buy on FOMO','fomo.family',FOMO],['04','Buy on LONG','app.long.xyz',LONG]].map(([n,a,b,href,fn,hint])=>{const inner=<><span className="stamp" style={{fontSize:30,margin:0}}>{n}</span><span style={{flex:1}}><b className="d" style={{fontSize:18}}>{a}</b><br/><span className="k">{b}</span></span>{hint&&<span className="k mhint">{hint}</span>}<span aria-hidden="true">→</span></>;return href?<a key={n} className="mopt" href={href} target="_blank" rel="noopener">{inner}</a>:<button key={n} className={'mopt'+(n==='01'||n==='02'?' hot':'')} onClick={fn}>{inner}</button>})}
<div className="mopt off" aria-disabled="true"><span className="stamp" style={{fontSize:30,margin:0}}>05</span><span style={{flex:1}}><b className="d" style={{fontSize:18}}>Leverage</b><br/><span className="k">Coming soon</span></span></div>
<div className="buy-foot">
  <div className="buy-foot-h">Need gas on Robinhood Chain?</div>
  <p className="k" style={{margin:'6px 0 10px',textTransform:'none',letterSpacing:0,lineHeight:1.45}}>Swaps need a little ETH for fees. Bridge ~0.01 ETH from Ethereum here, or grab $STRATEGY once you’re funded.</p>
  <div className="buy-foot-acts">
    <button type="button" className="btn" style={{marginTop:0,background:'var(--red)',color:'var(--on-red)',boxShadow:'3px 3px 0 var(--ink)',fontSize:12,padding:'10px 14px'}} onClick={toGas}>Get gas</button>
    <button type="button" className="btn" style={{marginTop:0,fontSize:12,padding:'10px 14px'}} onClick={toSwap}>Open swap</button>
    <a className="linkbtn" style={{textDecoration:'none'}} href={UNI} target="_blank" rel="noopener">Uniswap ↗</a>
  </div>
</div></>}
function Pools({pools}){return <><table><thead><tr><th>#</th><th>Pair</th><th>DEX</th><th>Liquidity</th><th>24h vol</th><th></th></tr></thead><tbody>{pools.map((p,i)=><tr key={p.id}><td className="stamp" style={{fontSize:18,margin:0}}>{String(i+1).padStart(2,'0')}</td><td><b>{p.name}</b></td><td>{p.dex}</td><td>{p.liq}</td><td>{p.vol}</td><td><a href={'https://www.geckoterminal.com/robinhood/pools/'+p.id} target="_blank" rel="noopener">↗</a></td></tr>)}</tbody></table>
<p className="k" style={{marginTop:10}}>Snapshot from GeckoTerminal. <a href={'https://www.geckoterminal.com/robinhood/tokens/'+CA} target="_blank" rel="noopener">All pools ↗</a> · <a href="https://dexscreener.com/robinhood/0xa6975f4720a95aa9cdfa9b010a065b0e941534c93f9fa708104c08f0ac029ca0" target="_blank" rel="noopener">Dexscreener ↗</a></p></>}
export default function Actions({links=[],pools,asOf,bare}){const [m,setM]=useState(null),[mock,setMock]=useState(false),[swapMode,setSwapMode]=useState('buy');
useEffect(()=>{const u=new URLSearchParams(location.search);if(u.get('modal')){setM(u.get('modal'));if(u.get('modal')==='gas'){setM('swap');setSwapMode('bridge')}}setMock(u.get('mock')==='1');const h=()=>{const k=location.hash.slice(1);if(k==='gas'){setM('swap');setSwapMode('bridge')}else if(['buy','swap','pools'].includes(k)){setM(k);if(k==='swap')setSwapMode('buy')}};h();addEventListener('hashchange',h);return()=>removeEventListener('hashchange',h)},[]);
const close=()=>{setM(null);setSwapMode('buy');if(location.hash)history.replaceState(null,'',location.pathname+location.search)};
const openSwap=(mode='buy')=>{setSwapMode(mode);setM('swap')};
return <>{!bare&&<div className="panel"><div className="pb"><div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
<button className="btn" style={{marginTop:0,background:'var(--red)',color:'var(--on-red)',boxShadow:'4px 4px 0 var(--ink)',fontSize:13,padding:'13px 22px'}} onClick={()=>setM('buy')}>Buy $STRATEGY</button>
<span className="btn" style={{marginTop:0,fontSize:13,padding:'13px 22px',cursor:'default'}}>Stake · soon</span><CopyCA/></div>
<div className="k" style={{display:'flex',flexWrap:'wrap',gap:'6px 14px',marginTop:12}}><button className="linkbtn" style={{textTransform:'inherit',letterSpacing:'inherit'}} onClick={()=>openSwap('buy')}>Swap</button><button className="linkbtn" style={{textTransform:'inherit',letterSpacing:'inherit'}} onClick={()=>openSwap('bridge')}>Get gas</button><button className="linkbtn" style={{textTransform:'inherit',letterSpacing:'inherit'}} onClick={()=>setM('pools')}>Pools</button>
{links.map(([a,b])=><a key={a} className="linkbtn" style={{textDecoration:'none'}} href={b} target="_blank" rel="noopener">{a} ↗</a>)}</div></div></div>}
{m==='swap'&&<Modal kicker={swapMode==='bridge'?'Get gas · Robinhood Chain':'Swap · best rate'} title={swapMode==='bridge'?'Bridge ETH for gas':'Swap $STRATEGY'} onClose={close}><Swap key={swapMode} mock={mock} initialMode={swapMode}/></Modal>}
{m==='buy'&&<Modal kicker="Buy now" title="Get $STRATEGY" onClose={close}><Buy toSwap={()=>openSwap('buy')} toGas={()=>openSwap('bridge')}/></Modal>}
{m==='pools'&&<Modal kicker={'Pools · liquidity · '+asOf} title="$STRATEGY pools" onClose={close}><Pools pools={pools}/></Modal>}</>}
