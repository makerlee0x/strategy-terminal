'use client';
// "Share image": on phones, the system share sheet with the PNG attached; elsewhere, a menu to post to X
// (the link previews as the image), download the PNG, copy the image or copy the link.
import { useEffect, useRef, useState } from 'react';
import { copyText } from './strategy/Modals';
const Icon = () => <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" d="M12 3v12M7 8l5-5 5 5M5 12v8h14v-8" /></svg>;
export default function ShareButton({ card, text, ready, style }) {
  const [open, setOpen] = useState(false), [note, setNote] = useState(''), box = useRef();
  const img = `/api/card/${card}`, day = new Date().toISOString().slice(0, 10);
  const link = () => `${location.origin}/share/${card}?d=${day}`;
  const flash = m => { setNote(m); setTimeout(() => setNote(''), 1800); };
  const png = async () => { const r = await fetch(img); if (!r.ok) throw new Error('image'); return r.blob(); };
  useEffect(() => { if (!open) return; const k = e => e.key === 'Escape' && setOpen(false), c = e => box.current && !box.current.contains(e.target) && setOpen(false); addEventListener('keydown', k); addEventListener('pointerdown', c); return () => { removeEventListener('keydown', k); removeEventListener('pointerdown', c); }; }, [open]);
  async function go() {
    if (matchMedia('(pointer: coarse)').matches && navigator.canShare) {
      try { const f = new File([await png()], `strategycoin-${card}.png`, { type: 'image/png' }); if (navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], text: text + ' ' + link() }); return; } }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    setOpen(v => !v);
  }
  const copyImg = async () => { try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': png() })]); flash('Image copied'); } catch (_) { flash('Copy not supported here: download instead'); } };
  return <div className="sharewrap" ref={box} style={style}>
    <button type="button" className="sharebtn" disabled={!ready} onClick={go} aria-expanded={open} aria-haspopup="menu"><Icon /> {ready ? 'Share image' : 'Loading…'}</button>
    {open && <div className="sharemenu" role="menu">
      <div className="sharethumb"><img src={img} alt="" width={1200} height={675} /><div className="k">1200 × 675 · live numbers</div></div>
      <a role="menuitem" href={`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link())}`} target="_blank" rel="noopener" onClick={() => setOpen(false)}>𝕏 Post to X <span>link shows this image</span></a>
      <a role="menuitem" href={img} download={`strategycoin-${card}.png`}>↓ Download PNG</a>
      <button role="menuitem" type="button" onClick={copyImg}>⧉ Copy image</button>
      <button role="menuitem" type="button" onClick={async () => { await copyText(link()); flash('Link copied'); }}>🔗 Copy link</button>
      {note && <div className="sharenote" role="status">{note}</div>}
    </div>}</div>;
}
