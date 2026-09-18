// Shared Relay helpers for strategycoin swap APIs.
// Server is the only place that talks to Relay and attaches app fees.

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

const STRATEGY = {
  address: "0x168661c52e5922288dfb2b3f323b6cf90eb21e18",
  chainId: 4663,
  decimals: 18,
  symbol: "STRATEGY"
};

const NATIVE_ETH = "0x0000000000000000000000000000000000000000";
const RH_RPC_DEFAULT = "https://rpc.mainnet.chain.robinhood.com";

function originAllowed(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    if (u.hostname.endsWith(".vercel.app") && u.hostname.includes("strategy-terminal")) {
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
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
  if (origin && originAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function relayBase() {
  return (process.env.RELAY_API_BASE_URL || "https://api.relay.link").replace(/\/$/, "");
}

function feeRecipient() {
  return String(process.env.RELAY_APP_FEE_RECIPIENT || "").trim();
}

function feeBps() {
  const n = Number(process.env.RELAY_APP_FEE_BPS || "0");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function injectAppFees(body) {
  const out = body && typeof body === "object" ? { ...body } : {};
  // Never trust client-supplied fee fields
  delete out.appFees;
  delete out.feeRecipient;
  delete out.interfaceFee;
  delete out.fees;
  const recipient = feeRecipient();
  const bps = feeBps();
  if (recipient && bps > 0) {
    out.appFees = [{ recipient, fee: String(bps) }];
  }
  return out;
}

const DROP_TX_KEYS = new Set([
  "nonce",
  "gasPrice",
  "maxFeePerGas",
  "maxPriorityFeePerGas"
]);

function sanitizeTxData(data) {
  if (!data || typeof data !== "object") return data;
  const clean = { ...data };
  for (const k of DROP_TX_KEYS) delete clean[k];
  // Keep gas / gasLimit if present
  return clean;
}

function sanitizeSteps(steps) {
  if (!Array.isArray(steps)) return [];
  return steps.map((step) => {
    const next = { ...step };
    if (Array.isArray(step.items)) {
      next.items = step.items.map((item) => {
        const it = { ...item };
        if (it.data && typeof it.data === "object") {
          it.data = sanitizeTxData(it.data);
        }
        return it;
      });
    }
    return next;
  });
}

function sanitizeQuote(payload) {
  if (!payload || typeof payload !== "object") return payload;
  const out = { ...payload };
  if (Array.isArray(out.steps)) out.steps = sanitizeSteps(out.steps);
  return out;
}

async function relayFetch(path, { method = "GET", body, timeoutMs = 20000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json"
    };
    const key = String(process.env.RELAY_API_KEY || "").trim();
    if (key) headers["x-api-key"] = key;

    const res = await fetch(relayBase() + path, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
      redirect: "error"
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (_) {
      json = { raw: String(text).slice(0, 500) };
    }
    return { ok: res.ok, status: res.status, json };
  } finally {
    clearTimeout(t);
  }
}

function sendJson(res, status, body, origin, extra) {
  res.statusCode = status;
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
    ...corsHeaders(origin),
    ...(extra || {})
  };
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === "object") {
      resolve(req.body);
      return;
    }
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 200_000) {
        reject(new Error("body_too_large"));
        try {
          req.destroy();
        } catch (_) {}
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function isAddress(v) {
  return typeof v === "string" && /^0x[a-fA-F0-9]{40}$/.test(v);
}

function isWeiAmount(v) {
  return typeof v === "string" && /^[0-9]+$/.test(v) && v.length <= 78 && BigInt(v) > 0n;
}

module.exports = {
  STRATEGY,
  NATIVE_ETH,
  RH_RPC_DEFAULT,
  originAllowed,
  corsHeaders,
  injectAppFees,
  sanitizeQuote,
  sanitizeSteps,
  relayFetch,
  sendJson,
  readJsonBody,
  isAddress,
  isWeiAmount,
  feeRecipient,
  feeBps
};
