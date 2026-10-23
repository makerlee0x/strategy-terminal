export const Barcode=({seed="MSTR",w=150,h=30,c="#f3e6dc"})=>{let x=0,bars=[];for(let i=0;x<w;i++){const c=seed.charCodeAt(i%seed.length)*(i+7);const bw=1+(c%3);if(i%2==0)bars.push(<rect key={i} x={x} width={bw} height={h} fill={c}/>);x+=bw+(c%2)}return <svg width={w} height={h}>{bars}</svg>};
export const Spark=({pts,w=220,h=50,c='#ff5a63'})=>{const mx=Math.max(...pts),mn=Math.min(...pts);return <svg width={w} height={h}><polyline fill="none" stroke={c} strokeWidth="1.6" points={pts.map((p,i)=>`${i*w/(pts.length-1)},${h-4-(p-mn)/(mx-mn||1)*(h-8)}`).join(' ')}/></svg>};
export const Panel=({t,r,children})=><div className="panel"><div className="ph"><span>{t}</span><span>{r}</span></div><div className="pb">{children}</div></div>;
/** "Post to X" that only becomes a link once the numbers in `text` are real (never posts "—"). */
export const ShareX = ({ ready, text, url, label = 'post to x', style }) => ready
  ? <a className="btn" href={'https://x.com/intent/post?text=' + encodeURIComponent(text) + (url ? '&url=' + encodeURIComponent(url) : '')} target="_blank" rel="noopener" style={style}>{label}</a>
  : <span className="btn" aria-disabled="true" title="Waiting for live data" style={{ ...style, opacity: .45, cursor: 'not-allowed' }}>{label}</span>;
