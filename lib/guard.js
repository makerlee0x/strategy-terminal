// Port of strategy-terminal api/_guard.js for Next.js Route Handlers.
// Per-isolate memory: rate buckets, short upstream caches, single-flight.
const RATE_BUCKETS = new Map(), CACHE = new Map(), INFLIGHT = new Map();
const MAX_BUCKETS = 4000, MAX_CACHE = 128;
const STATIC_ORIGINS = new Set([
  'https://strategycoin.io', 'https://www.strategycoin.io',
  'http://localhost:3000', 'http://127.0.0.1:3000'
]);
function prune(map, max) { if (map.size <= max) return; let drop = map.size - max; for (const k of map.keys()) { map.delete(k); if (--drop <= 0) break; } }
export function clientIp(req) {
  const xf = String(req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  if (xf) return xf.slice(0, 64);
  const real = String(req.headers.get('x-real-ip') || '').trim();
  return real ? real.slice(0, 64) : 'unknown';
}
export function originAllowed(origin) {
  if (!origin) return true; // same-origin / server-to-server
  if (STATIC_ORIGINS.has(origin)) return true;
  try {
    const u = new URL(origin);
    if (u.hostname === 'strategycoin.io' || u.hostname === 'www.strategycoin.io') return u.protocol === 'https:';
    // This Vercel project's own deployments (production / branch / preview URLs).
    const own = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL].filter(Boolean);
    if (own.includes(u.host)) return true;
    const proj = process.env.VERCEL_PREVIEW_PREFIX || 'strategy';
    if (u.protocol === 'https:' && u.hostname.endsWith('.vercel.app') && u.hostname.startsWith(proj)) return true;
  } catch (_) {}
  return false;
}
export function rateLimit(req, { limit = 30, windowMs = 60_000, prefix = 'api' } = {}) {
  const key = prefix + ':' + clientIp(req), now = Date.now();
  let b = RATE_BUCKETS.get(key);
  if (!b || now >= b.resetAt) { b = { count: 0, resetAt: now + windowMs }; RATE_BUCKETS.set(key, b); prune(RATE_BUCKETS, MAX_BUCKETS); }
  b.count += 1;
  return b.count > limit ? { ok: false, retryAfter: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) } : { ok: true };
}
export async function cachedFetch(key, maxAgeMs, fn) {
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.at <= maxAgeMs) return { value: hit.value, cache: 'HIT' };
  if (INFLIGHT.has(key)) return { value: await INFLIGHT.get(key), cache: 'COALESCED' };
  const p = Promise.resolve().then(fn).then(v => { CACHE.set(key, { at: Date.now(), value: v }); prune(CACHE, MAX_CACHE); return v; }).finally(() => INFLIGHT.delete(key));
  INFLIGHT.set(key, p);
  return { value: await p, cache: 'MISS' };
}
/** Last good value even if stale (for 'data delayed' responses). */
export function lastGood(key) { const h = CACHE.get(key); return h ? { value: h.value, at: h.at } : null; }
export function looksLikeBrowser(req) {
  const ua = String(req.headers.get('user-agent') || '');
  if (!ua || ua.length < 12) return false;
  return !/^(curl|wget|python-requests|Go-http-client|scrapy|httpclient)\b/i.test(ua);
}
function refererAllowed(req) {
  const o = req.headers.get('origin'); if (o && originAllowed(o)) return true;
  const r = req.headers.get('referer'); if (!r) return false;
  try { return originAllowed(new URL(r).origin); } catch (_) { return false; }
}
const SEC = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY', 'Permissions-Policy': 'geolocation=(), microphone=(), camera=()' };
function cors(origin) {
  const h = { 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Accept, Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
  if (origin && originAllowed(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}
export function json(body, { status = 200, origin = '', sMaxAge = 60, swr = 300, headers = {} } = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`, ...SEC, ...cors(origin), ...headers } });
}
/** Common preamble: origin check, OPTIONS, method, rate limit. Returns a Response to short-circuit, or null. */
export function preflight(req, { browser = { limit: 40 }, anon = { limit: 12 }, prefix = 'api' } = {}) {
  const origin = req.headers.get('origin') || '';
  if (origin && !originAllowed(origin)) return json({ ok: false, error: 'origin_not_allowed' }, { status: 403 });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...SEC, ...cors(origin) } });
  if (req.method !== 'GET' && req.method !== 'HEAD') return json({ ok: false, error: 'method_not_allowed' }, { status: 405, origin });
  const browserish = looksLikeBrowser(req) && (refererAllowed(req) || !origin);
  const rl = rateLimit(req, browserish ? { ...browser, prefix } : { ...anon, prefix: prefix + '-anon' });
  if (!rl.ok) return json({ ok: false, error: 'rate_limited' }, { status: 429, origin, headers: { 'Retry-After': String(rl.retryAfter), 'Cache-Control': 'no-store' } });
  return null;
}
export async function getJson(url, { ms = 12000, headers = {}, method = 'GET', body, maxBytes = 2_000_000 } = {}) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { method, body, signal: ctrl.signal, cache: 'no-store', headers: { Accept: 'application/json', 'User-Agent': 'strategycoin-hub/1.0', ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers } });
    if (!r.ok) throw new Error('upstream_' + r.status);
    const text = await r.text(); if (text.length > maxBytes) throw new Error('upstream_too_large');
    return JSON.parse(text);
  } finally { clearTimeout(t); }
}
export async function getText(url, { ms = 15000, headers = {}, maxBytes = 8_000_000 } = {}) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, cache: 'no-store', headers: { 'User-Agent': 'strategycoin-hub/1.0', ...headers } });
    if (!r.ok) throw new Error('upstream_' + r.status);
    const text = await r.text(); if (text.length > maxBytes) throw new Error('upstream_too_large');
    return text;
  } finally { clearTimeout(t); }
}
