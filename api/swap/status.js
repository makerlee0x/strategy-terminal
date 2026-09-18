const {
  originAllowed,
  corsHeaders,
  relayFetch,
  sendJson
} = require("../_relay");
const { rateLimit, looksLikeBrowser, refererAllowed } = require("../_guard");

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (origin && !originAllowed(origin)) {
    sendJson(res, 403, { ok: false, error: "origin_not_allowed" }, "");
    return;
  }
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    for (const [k, v] of Object.entries(corsHeaders(origin))) res.setHeader(k, v);
    res.end();
    return;
  }
  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" }, origin);
    return;
  }

  const browserish =
    looksLikeBrowser(req) && (refererAllowed(req, originAllowed) || !origin);
  const limited = rateLimit(req, {
    limit: browserish ? 60 : 15,
    windowMs: 60_000,
    prefix: "swap-status"
  });
  if (!limited.ok) {
    sendJson(
      res,
      429,
      { ok: false, error: "rate_limited" },
      origin,
      { "Retry-After": String(limited.retryAfter) }
    );
    return;
  }

  const url = new URL(req.url, "http://localhost");
  const requestId = String(url.searchParams.get("requestId") || "").trim();
  if (!/^0x[a-fA-F0-9]{64}$/.test(requestId) && !/^[a-zA-Z0-9_-]{8,128}$/.test(requestId)) {
    sendJson(res, 400, { ok: false, error: "invalid_request_id" }, origin);
    return;
  }

  const upstream = await relayFetch(
    "/intents/status/v3?requestId=" + encodeURIComponent(requestId),
    { method: "GET", timeoutMs: 15000 }
  );
  if (!upstream.ok || !upstream.json) {
    sendJson(
      res,
      upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502,
      { ok: false, error: "status_failed" },
      origin
    );
    return;
  }

  sendJson(res, 200, { ok: true, status: upstream.json }, origin);
};
