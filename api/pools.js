// Same-origin pools panel — GeckoTerminal onchain pools for STRATEGY (CRT display).
const {
  rateLimit,
  cachedFetch,
  looksLikeBrowser,
  refererAllowed
} = require("./_guard");

const STRATEGY = "0x168661c52e5922288dfb2b3f323b6cf90eb21e18";
const PRIMARY_POOL =
  "0xa6975f4720a95aa9cdfa9b010a065b0e941534c93f9fa708104c08f0ac029ca0";
const GT =
  "https://api.geckoterminal.com/api/v2/networks/robinhood/tokens/" +
  STRATEGY +
  "/pools?page=1";
const UPSTREAM_CACHE_MS = 60_000;
const RATE_BROWSER = { limit: 30, windowMs: 60_000, prefix: "pools" };
const RATE_ANON = { limit: 10, windowMs: 60_000, prefix: "pools-anon" };

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

function fmtUsdCompact(n) {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return "$" + (n / 1e9).toFixed(2).replace(/\.00$/, "") + "B";
  if (abs >= 1e6) return "$" + (n / 1e6).toFixed(2).replace(/\.00$/, "") + "M";
  if (abs >= 1e3) return "$" + (n / 1e3).toFixed(2).replace(/\.00$/, "") + "K";
  return "$" + n.toFixed(2);
}

function titleDex(id) {
  if (!id) return "Pool";
  return String(id)
    .split("-")
    .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join("-");
}

function feeFromName(name) {
  const m = String(name || "").match(/(\d+(?:\.\d+)?)\s*%/);
  return m ? m[1] + "%" : "—";
}

function mapPools(raw) {
  const rows = Array.isArray(raw && raw.data) ? raw.data : [];
  const pools = [];
  for (const p of rows.slice(0, 8)) {
    const a = (p && p.attributes) || {};
    const addr = String(a.address || "").toLowerCase();
    if (!addr) continue;
    const dexId =
      (((p.relationships || {}).dex || {}).data || {}).id ||
      String(p.id || "").split("_")[0] ||
      "";
    const name = String(a.name || "STRATEGY pair").slice(0, 80);
    const liq = Number(a.reserve_in_usd);
    const vol = Number(a.volume_usd && a.volume_usd.h24);
    const primary = addr === PRIMARY_POOL;
    pools.push({
      id: addr,
      dex: titleDex(dexId).slice(0, 48),
      pair: name,
      primary,
      liquidityUsd: fmtUsdCompact(liq),
      volume24h: fmtUsdCompact(vol),
      fee: feeFromName(name),
      url: "https://www.geckoterminal.com/robinhood/pools/" + addr
    });
  }
  pools.sort((a, b) => {
    if (a.primary !== b.primary) return a.primary ? -1 : 1;
    return 0;
  });
  return {
    ok: true,
    pairLabel: "STRATEGY / MSTR",
    source: "coingecko",
    note:
      "Fee % shown only when the pool name reports it — we never invent APR.",
    pools
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

  try {
    const { value, cache } = await cachedFetch("pools:strategy", UPSTREAM_CACHE_MS, async () => {
      const upstream = await fetch(GT, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "strategycoin-terminal/1.0"
        },
        cache: "no-store",
        redirect: "error"
      });
      if (!upstream.ok) throw new Error("upstream_" + upstream.status);
      const text = await upstream.text();
      if (text.length > 400_000) throw new Error("upstream_too_large");
      return mapPools(JSON.parse(text));
    });
    send(res, 200, value, origin, { "X-Cache": cache });
  } catch (_) {
    send(
      res,
      200,
      {
        ok: false,
        pairLabel: "STRATEGY / MSTR",
        source: "fallback",
        note: "Pool list unavailable right now.",
        pools: []
      },
      origin,
      { "X-Cache": "FALLBACK" }
    );
  }
};
