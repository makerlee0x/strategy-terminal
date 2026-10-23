// Server-side first render: run our own API handlers in-process and hand their JSON to the page,
// so the HTML (and link previews, crawlers) carries real numbers or the last good value marked DATA DELAYED.
const ROUTES = {
  '/api/strategy-metrics': () => import('../app/api/strategy-metrics/route'),
  '/api/pool-backing': () => import('../app/api/pool-backing/route'),
  '/api/strategy-history': () => import('../app/api/strategy-history/route'),
  '/api/strategy-filings': () => import('../app/api/strategy-filings/route'),
  '/api/mstr-tokens': () => import('../app/api/mstr-tokens/route'),
  '/api/robinhood-mstr': () => import('../app/api/robinhood-mstr/route'),
  '/api/pools': () => import('../app/api/pools/route'),
  '/api/offhours': () => import('../app/api/offhours/route'),
  '/api/chains': () => import('../app/api/chains/route'),
  '/api/perps': () => import('../app/api/perps/route')
};
const TIMEOUT_MS = 3500; // slower feeds fall back to the browser fetch rather than holding up the page
/** { url: payload } for each url that answered in time; missing urls fall back to the browser fetch. */
export async function initial(urls) {
  const out = {};
  await Promise.all(urls.map(async u => {
    try {
      const mod = await ROUTES[u.split('?')[0]]?.(); if (!mod) return;
      const req = new Request('http://ssr.local' + u, { headers: { 'x-forwarded-for': 'ssr', 'user-agent': 'strategycoin-ssr' } });
      const res = await Promise.race([mod.GET(req), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), TIMEOUT_MS))]);
      if (res.ok) out[u] = await res.json();
    } catch (_) {}
  }));
  return out;
}
