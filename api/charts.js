// Same-origin chart proxy → StockTokenSwap /api/charts/:token
const {
  rateLimit,
  cachedFetch,
  looksLikeBrowser,
  refererAllowed
} = require("./_guard");

const STS = "https://stocktokenswap.com";
const STRATEGY = "0x168661c52e5922288dfb2b3f323b6cf90eb21e18";
const PRIMARY_POOL =
  "0xa6975f4720a95aa9cdfa9b010a065b0e941534c93f9fa708104c08f0ac029ca0";
const UPSTREAM_CACHE_MS = 60_000;
const RATE_BROWSER = { limit: 30, windowMs: 60_000, prefix: "charts" };
const RATE_ANON = { limit: 10, windowMs: 60_000, prefix: "charts-anon" };

const ALLOWED_ORIGINS = new Set([
  "https://strategycoin.io",
  "https://www.strategycoin.io",
  "https://strategy-terminal.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8000",
  "http://127.0.0.1:8765"
]);

function originAllowed(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const u = new URL(origin);
    if (
      u.hostname.endsWith(".vercel.app") &&
      u.hostname.includes("strategy-terminal")
    ) {
      return true;
    }
    if (u.hostname === "strategycoin.io" || u.hostname === "www.strategycoin.io") {
      return true;
    }
  } catch (_) {}
  return false;
}

function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
  if (origin && originAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function securityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=120"
  };
}

function send(res, status, body, origin, extraHeaders) {
  res.statusCode = status;
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    ...securityHeaders(),
    ...corsHeaders(origin),
    ...(extraHeaders || {})
  };
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

function isAddr(v) {
  return typeof v === "string" && /^0x[a-fA-F0-9]{40}$/.test(v);
}

function isPoolId(v) {
  return typeof v === "string" && /^0x[a-fA-F0-9]{40,66}$/.test(v);
}

function pickResolution(raw) {
  const s = String(raw || "60");
  if (s === "15" || s === "60" || s === "240") return s;
  return "60";
}

function pickDays(raw) {
  const n = Number(raw);
  if (n === 1 || n === 7 || n === 30) return n;
  return 7;
}

function sanitizeSeries(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const series = src.series && typeof src.series === "object" ? src.series : src;
  const candlesIn = Array.isArray(series.candles) ? series.candles : [];
  const candles = [];
  for (const c of candlesIn.slice(-500)) {
    if (!c || typeof c !== "object") continue;
    const time = Number(c.time);
    const open = Number(c.open);
    const high = Number(c.high);
    const low = Number(c.low);
    const close = Number(c.close);
    if (![time, open, high, low, close].every(Number.isFinite)) continue;
    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume: Number.isFinite(Number(c.volume)) ? Number(c.volume) : 0
    });
  }
  return {
    ok: true,
    candles,
    source: String(series.source || "coingecko").slice(0, 32),
    resolution: String(series.resolution || "").slice(0, 16),
    symbol: String(series.symbol || "STRATEGY").slice(0, 64),
    observedAt: String(series.observedAt || "").slice(0, 40),
    pairId: PRIMARY_POOL
  };
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (origin && !originAllowed(origin)) {
    send(res, 403, { ok: false, error: "origin_not_allowed" }, "");
    return;
  }
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    for (const [k, v] of Object.entries({ ...securityHeaders(), ...corsHeaders(origin) })) {
      res.setHeader(k, v);
    }
    res.end();
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, { ok: false, error: "method_not_allowed" }, origin);
    return;
  }

  const browserish =
    looksLikeBrowser(req) && (refererAllowed(req, originAllowed) || !origin);
  const limited = rateLimit(req, browserish ? RATE_BROWSER : RATE_ANON);
  if (!limited.ok) {
    send(
      res,
      429,
      { ok: false, error: "rate_limited" },
      origin,
      { "Retry-After": String(limited.retryAfter), "Cache-Control": "no-store" }
    );
    return;
  }

  let url;
  try {
    url = new URL(req.url, "http://localhost");
  } catch (_) {
    send(res, 400, { ok: false, error: "bad_request" }, origin);
    return;
  }

  const token = isAddr(url.searchParams.get("token"))
    ? url.searchParams.get("token").toLowerCase()
    : STRATEGY;
  const pairId = isPoolId(url.searchParams.get("pairId"))
    ? url.searchParams.get("pairId").toLowerCase()
    : PRIMARY_POOL;
  const resolution = pickResolution(url.searchParams.get("resolution"));
  const rangeDays = pickDays(url.searchParams.get("rangeDays"));

  const cacheKey = `charts:${token}:${pairId}:${resolution}:${rangeDays}`;
  try {
    const { value, cache } = await cachedFetch(cacheKey, UPSTREAM_CACHE_MS, async () => {
      const qs = new URLSearchParams({
        resolution,
        rangeDays: String(rangeDays),
        pairId
      });
      const upstream = await fetch(`${STS}/api/charts/${token}?${qs}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        redirect: "error"
      });
      if (!upstream.ok) throw new Error("upstream_" + upstream.status);
      const text = await upstream.text();
      if (text.length > 800_000) throw new Error("upstream_too_large");
      return sanitizeSeries(JSON.parse(text));
    });
    send(res, 200, value, origin, { "X-Cache": cache });
  } catch (_) {
    send(res, 502, { ok: false, error: "chart_unavailable", candles: [] }, origin);
  }
};
