// Shared abuse controls for Vercel serverless handlers.
// Per-isolate memory: rate buckets + short upstream caches so bots
// cannot force a Codex/upstream hit on every request.

const RATE_BUCKETS = new Map();
const CACHE = new Map();
const INFLIGHT = new Map();

const MAX_BUCKETS = 4000;
const MAX_CACHE = 64;

function clientIp(req) {
  const xf = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  if (xf) return xf.slice(0, 64);
  const real = String(req.headers["x-real-ip"] || "").trim();
  if (real) return real.slice(0, 64);
  const sock = req.socket && req.socket.remoteAddress;
  return sock ? String(sock).slice(0, 64) : "unknown";
}

function pruneMap(map, max) {
  if (map.size <= max) return;
  const drop = map.size - max;
  let i = 0;
  for (const key of map.keys()) {
    map.delete(key);
    if (++i >= drop) break;
  }
}

/**
 * Sliding fixed-window rate limit.
 * @returns {{ ok: true } | { ok: false, retryAfter: number }}
 */
function rateLimit(req, opts) {
  const limit = opts && opts.limit != null ? opts.limit : 30;
  const windowMs = opts && opts.windowMs != null ? opts.windowMs : 60_000;
  const prefix = (opts && opts.prefix) || "api";
  const ip = clientIp(req);
  const key = prefix + ":" + ip;
  const now = Date.now();
  let bucket = RATE_BUCKETS.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    RATE_BUCKETS.set(key, bucket);
    pruneMap(RATE_BUCKETS, MAX_BUCKETS);
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    };
  }
  return { ok: true, remaining: Math.max(0, limit - bucket.count) };
}

function getCache(key, maxAgeMs) {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > maxAgeMs) {
    CACHE.delete(key);
    return null;
  }
  return hit.value;
}

function setCache(key, value) {
  CACHE.set(key, { at: Date.now(), value });
  pruneMap(CACHE, MAX_CACHE);
}

/** Serve cached value or run fn once (single-flight) and cache the result. */
async function cachedFetch(key, maxAgeMs, fn) {
  const hit = getCache(key, maxAgeMs);
  if (hit != null) return { value: hit, cache: "HIT" };
  if (INFLIGHT.has(key)) {
    const value = await INFLIGHT.get(key);
    return { value, cache: "COALESCED" };
  }
  const pending = Promise.resolve()
    .then(fn)
    .then((value) => {
      setCache(key, value);
      return value;
    })
    .finally(() => {
      INFLIGHT.delete(key);
    });
  INFLIGHT.set(key, pending);
  const value = await pending;
  return { value, cache: "MISS" };
}

function looksLikeBrowser(req) {
  const ua = String(req.headers["user-agent"] || "");
  if (!ua || ua.length < 12) return false;
  // Obvious scrapers / empty tooling
  if (/^(curl|wget|python-requests|Go-http-client|scrapy|httpclient)\b/i.test(ua)) {
    return false;
  }
  return true;
}

function refererAllowed(req, originAllowedFn) {
  const origin = req.headers.origin || "";
  if (origin && originAllowedFn(origin)) return true;
  const ref = req.headers.referer || req.headers.referrer || "";
  if (!ref) return false;
  try {
    const u = new URL(ref);
    return originAllowedFn(u.origin);
  } catch (_) {
    return false;
  }
}

module.exports = {
  clientIp,
  rateLimit,
  getCache,
  setCache,
  cachedFetch,
  looksLikeBrowser,
  refererAllowed
};
