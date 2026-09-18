const {
  originAllowed,
  corsHeaders,
  sendJson,
  STRATEGY,
  NATIVE_ETH,
  RH_RPC_DEFAULT
} = require("../_relay");

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

  sendJson(
    res,
    200,
    {
      ok: true,
      strategy: STRATEGY,
      nativeEth: NATIVE_ETH,
      rpcUrl:
        process.env.NEXT_PUBLIC_ROBINHOOD_CHAIN_RPC_URL ||
        process.env.ROBINHOOD_CHAIN_RPC_URL ||
        RH_RPC_DEFAULT,
      wcProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
      defaultPair: {
        originChainId: STRATEGY.chainId,
        destinationChainId: STRATEGY.chainId,
        originCurrency: NATIVE_ETH,
        destinationCurrency: STRATEGY.address
      }
    },
    origin
  );
};
