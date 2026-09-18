const {
  originAllowed,
  corsHeaders,
  injectAppFees,
  sanitizeQuote,
  relayFetch,
  sendJson,
  readJsonBody,
  isAddress,
  isWeiAmount,
  STRATEGY,
  NATIVE_ETH
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
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" }, origin);
    return;
  }

  const browserish =
    looksLikeBrowser(req) && (refererAllowed(req, originAllowed) || !origin);
  const limited = rateLimit(req, {
    limit: browserish ? 20 : 6,
    windowMs: 60_000,
    prefix: "swap-exec"
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

  let body;
  try {
    body = await readJsonBody(req);
  } catch (_) {
    sendJson(res, 400, { ok: false, error: "invalid_json" }, origin);
    return;
  }

  // Always re-quote fresh on execute — never execute a client-supplied quote blob.
  const user = body.user || body.taker || body.wallet;
  if (!isAddress(user)) {
    sendJson(res, 400, { ok: false, error: "invalid_user" }, origin);
    return;
  }
  const amount = body.amount;
  if (!isWeiAmount(amount)) {
    sendJson(res, 400, { ok: false, error: "invalid_amount" }, origin);
    return;
  }

  const originChainId = Number(body.originChainId || STRATEGY.chainId);
  const destinationChainId = Number(body.destinationChainId || STRATEGY.chainId);
  if (originChainId !== STRATEGY.chainId || destinationChainId !== STRATEGY.chainId) {
    sendJson(res, 400, { ok: false, error: "unsupported_chain" }, origin);
    return;
  }

  const originCurrency = String(body.originCurrency || NATIVE_ETH).toLowerCase();
  const destinationCurrency = String(
    body.destinationCurrency || STRATEGY.address
  ).toLowerCase();
  if (destinationCurrency !== STRATEGY.address.toLowerCase()) {
    sendJson(res, 400, { ok: false, error: "unsupported_output" }, origin);
    return;
  }

  const relayBody = injectAppFees({
    user,
    originChainId,
    destinationChainId,
    originCurrency,
    destinationCurrency,
    amount,
    tradeType: body.tradeType === "EXACT_OUTPUT" ? "EXACT_OUTPUT" : "EXACT_INPUT"
  });

  const upstream = await relayFetch("/quote/v2", { method: "POST", body: relayBody });
  if (!upstream.ok || !upstream.json || !upstream.json.requestId) {
    sendJson(
      res,
      upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502,
      {
        ok: false,
        error: "execute_quote_failed",
        detail: upstream.json && (upstream.json.message || upstream.json.error)
      },
      origin
    );
    return;
  }

  const quote = sanitizeQuote(upstream.json);
  sendJson(
    res,
    200,
    {
      ok: true,
      requestId: quote.requestId,
      steps: quote.steps || [],
      details: quote.details || null,
      fees: quote.fees || null
    },
    origin
  );
};
