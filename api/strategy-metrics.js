// Vercel serverless proxy for Strategy Coin terminal metrics.
// Same-origin on *.vercel.app + strategycoin.io; Codex key stays on StockTokenSwap.

const UPSTREAM =
  process.env.STRATEGY_METRICS_URL ||
  "https://stocktokenswap.com/api/strategy-metrics";

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
  liquidityUsd: "$636.48K",
  mstrInLp: "2.17K",
  mstrTokenized: "29.55K",
  mstrInLpPct: "7.36%",
  volume24h: "$695.01K",
  holders: "1,839",
  pairAsset: "MSTR",
  sourceTime: "--:--:--"
};

function corsHeaders(origin) {
  const allowed = new Set([
    "https://strategycoin.io",
    "https://www.strategycoin.io",
    "https://strategy-terminal.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8765"
  ]);
  const host = String(origin || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const ok =
    !origin ||
    allowed.has(origin) ||
    host.endsWith(".vercel.app") ||
    host === "strategycoin.io" ||
    host === "www.strategycoin.io";

  return {
    "Access-Control-Allow-Origin": ok && origin ? origin : "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

function send(res, status, body, origin) {
  res.statusCode = status;
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60",
    ...corsHeaders(origin)
  };
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || "";

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    for (const [k, v] of Object.entries(corsHeaders(origin))) res.setHeader(k, v);
    res.end();
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, { ok: false, error: "method_not_allowed" }, origin);
    return;
  }

  try {
    const upstream = await fetch(UPSTREAM, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (upstream.ok) {
      const data = await upstream.json();
      if (data && typeof data === "object") {
        send(
          res,
          200,
          {
            ...data,
            ok: data.ok !== false,
            source: data.source || "stocktokenswap"
          },
          origin
        );
        return;
      }
    }
  } catch (_) {
    // Upstream missing/down — keep the CRT populated on Vercel.
  }

  send(res, 200, FALLBACK, origin);
};
