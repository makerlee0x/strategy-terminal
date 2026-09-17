// Vercel serverless proxy for Strategy Coin terminal metrics.
// Same-origin on this site; CoinGecko key stays on StockTokenSwap only.
// This is NOT a generic market-data proxy — fixed upstream URL, allowlisted fields.

const UPSTREAM =
  process.env.STRATEGY_METRICS_URL ||
  "https://stocktokenswap.com/api/strategy-metrics";

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

const FIELD_KEYS = [
  "ok",
  "source",
  "asOf",
  "priceUsd",
  "change24h",
  "change24hPositive",
  "priceMstr",
  "marketCap",
  "fdv",
  "totalSupply",
  "liquidityUsd",
  "mstrInLp",
  "mstrTokenized",
  "mstrInLpPct",
  "volume24h",
  "holders",
  "pairAsset",
  "sourceTime"
];

const FALLBACK = {
  ok: true,
  source: "fallback",
  asOf: null,
  priceUsd: "$0.004036",
  change24h: "1.01%",
  change24hPositive: true,
  priceMstr: "0.000030",
  marketCap: "$4.03M",
  fdv: "$4.03M",
  totalSupply: "1.00B",
  liquidityUsd: "$636.48K",
  mstrInLp: "2.17K",
  mstrTokenized: "29.55K",
  mstrInLpPct: "7.36%",
  volume24h: "$695.01K",
  holders: "1,839",
  pairAsset: "MSTR",
  sourceTime: "--:--:--"
};

function originAllowed(origin) {
  if (!origin) return true; // same-origin / curl / server-to-server
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    // Preview deploys for this project only (not arbitrary *.vercel.app)
    if (
      u.hostname.endsWith(".vercel.app") &&
      (u.hostname.startsWith("strategy-terminal") ||
        u.hostname.includes("strategy-terminal"))
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
  // No Origin (same-origin browser nav / curl): omit ACAO rather than *
  return headers;
}

function securityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    // Shared edge cache: many open terminals → one STS/Codex pull per minute.
    // max-age=0 keeps browsers revalidating; SWR serves last-good while refreshing.
    "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300"
  };
}

function asDisplayString(v, max = 64) {
  if (v == null) return null;
  if (typeof v === "boolean") return v;
  const s = String(v).trim();
  if (!s) return null;
  // strip control chars / keep CRT-safe text
  return s.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, max);
}

function pickPayload(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const out = {};
  for (const key of FIELD_KEYS) {
    if (!(key in src)) continue;
    if (key === "ok" || key === "change24hPositive") {
      out[key] = Boolean(src[key]);
      continue;
    }
    const cleaned = asDisplayString(src[key]);
    if (cleaned != null) out[key] = cleaned;
  }
  // never trust upstream ok/source blindly for terminal semantics
  out.ok = out.ok !== false;
  out.source = asDisplayString(src.source, 32) || "stocktokenswap";
  return out;
}

function send(res, status, body, origin) {
  res.statusCode = status;
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    ...securityHeaders(),
    ...corsHeaders(origin)
  };
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || "";

  // Cross-origin callers must be allowlisted
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

  // Ignore query strings — no user-controlled upstream routing
  if (!/^https:\/\/stocktokenswap\.com\/api\/strategy-metrics\/?$/.test(UPSTREAM) &&
      !process.env.STRATEGY_METRICS_URL) {
    // default path only; custom env must still be https
  }
  if (process.env.STRATEGY_METRICS_URL) {
    try {
      const u = new URL(process.env.STRATEGY_METRICS_URL);
      if (u.protocol !== "https:") {
        send(res, 500, { ok: false, error: "insecure_upstream" }, origin);
        return;
      }
    } catch (_) {
      send(res, 500, { ok: false, error: "invalid_upstream" }, origin);
      return;
    }
  }

  try {
    const upstream = await fetch(UPSTREAM, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      redirect: "error"
    });

    if (upstream.ok) {
      const text = await upstream.text();
      if (text.length > 32_000) {
        send(res, 200, FALLBACK, origin);
        return;
      }
      const data = JSON.parse(text);
      if (data && typeof data === "object" && !Array.isArray(data)) {
        const payload = pickPayload(data);
        if (payload.priceUsd || payload.marketCap) {
          send(res, 200, { ...FALLBACK, ...payload, ok: true }, origin);
          return;
        }
      }
    }
  } catch (_) {
    // Upstream missing/down — keep the CRT populated on Vercel.
  }

  send(res, 200, FALLBACK, origin);
};
