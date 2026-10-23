'use client';
import { useEffect, useState } from 'react';
/** Fetch one or more same-origin API routes and refresh every `ms` (default 60s).
 *  `init` ({ url: payload }) seeds the first render with server-fetched data, so pages never open on dashes. */
export function useLive(urls, ms = 60_000, init) {
  const list = Array.isArray(urls) ? urls : [urls];
  const [state, setState] = useState(() => list.map(u => init?.[u] ?? null));
  const key = list.join('|');
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await Promise.all(list.map(u => fetch(u, { headers: { Accept: 'application/json' } }).then(r => r.json()).catch(() => ({ ok: false, delayed: true, error: 'network' }))));
      if (alive) setState(res);
    };
    load(); const t = setInterval(() => { if (!document.hidden) load(); }, ms);
    const vis = () => { if (!document.hidden) load(); }; document.addEventListener('visibilitychange', vis);
    return () => { alive = false; clearInterval(t); document.removeEventListener('visibilitychange', vis); };
  }, [key, ms]);
  return Array.isArray(urls) ? state : state[0];
}
