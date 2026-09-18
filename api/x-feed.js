// Same-origin feed for NEWS panel — @strategystock posts without X widgets.js.
// Scrapes public profile HTML for status IDs, hydrates text via FxTwitter.

const SCREEN = "strategystock";
const PROFILE_URL = `https://x.com/${SCREEN}`;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

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
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
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

function send(res, status, body, origin) {
  res.statusCode = status;
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
    ...corsHeaders(origin)
  };
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

function cleanText(s, max = 480) {
  if (s == null) return "";
  return String(s)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, max);
}

async function fetchText(url, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/json",
        "Accept-Language": "en-US,en;q=0.9"
      },
      redirect: "follow"
    });
    if (!r.ok) throw new Error(`http_${r.status}`);
    return await r.text();
  } finally {
    clearTimeout(t);
  }
}

async function fetchJson(url, ms = 10000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": UA, Accept: "application/json" },
      redirect: "follow"
    });
    if (!r.ok) throw new Error(`http_${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

function extractIds(html) {
  const refs = [...html.matchAll(/tweet-(\d{10,})/g)].map((m) => m[1]);
  const paths = [
    ...html.matchAll(/(?:x\.com|twitter\.com)\/strategystock\/status\/(\d{10,})/gi)
  ].map((m) => m[1]);
  const ordered = [];
  const seen = new Set();
  for (const id of [...refs, ...paths]) {
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push(id);
  }
  return ordered.slice(0, 8);
}

async function hydrateTweet(id) {
  const d = await fetchJson(`https://api.fxtwitter.com/status/${id}`);
  const t = (d && d.tweet) || {};
  const text = cleanText(t.text || t.raw_text?.text || "");
  if (!text) return null;
  return {
    id: String(id),
    text,
    createdAt: cleanText(t.created_at || t.date || "", 64),
    url: `https://x.com/${SCREEN}/status/${id}`,
    likes: typeof t.likes === "number" ? t.likes : null,
    reposts:
      typeof t.retweets === "number"
        ? t.retweets
        : typeof t.reposts === "number"
          ? t.reposts
          : null
  };
}

function parseTwitterDate(s) {
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : 0;
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (origin && !originAllowed(origin)) {
    send(res, 403, { ok: false, error: "origin_not_allowed" }, "");
    return;
  }
  if (req.method === "OPTIONS") {
    send(res, 204, {}, origin);
    return;
  }
  if (req.method !== "GET") {
    send(res, 405, { ok: false, error: "method_not_allowed" }, origin);
    return;
  }

  let profile = {
    name: "Strategy Coin",
    handle: `@${SCREEN}`,
    url: PROFILE_URL,
    description: ""
  };
  try {
    const fx = await fetchJson(`https://api.fxtwitter.com/${SCREEN}`);
    const u = (fx && fx.user) || {};
    profile = {
      name: cleanText(u.name || "Strategy Coin", 80),
      handle: `@${SCREEN}`,
      url: PROFILE_URL,
      description: cleanText(u.description || "", 240),
      followers: typeof u.followers === "number" ? u.followers : null,
      avatar: cleanText(u.avatar_url || "", 240)
    };
  } catch (_) {}

  let posts = [];
  let source = "empty";
  try {
    const html = await fetchText(PROFILE_URL);
    const ids = extractIds(html);
    const hydrated = await Promise.all(
      ids.map(async (id) => {
        try {
          return await hydrateTweet(id);
        } catch (_) {
          return null;
        }
      })
    );
    posts = hydrated
      .filter(Boolean)
      .sort((a, b) => parseTwitterDate(b.createdAt) - parseTwitterDate(a.createdAt))
      .slice(0, 6);
    if (posts.length) source = "x+fxtwitter";
  } catch (_) {
    source = "error";
  }

  send(
    res,
    200,
    {
      ok: posts.length > 0,
      source,
      asOf: new Date().toISOString(),
      profile,
      posts
    },
    origin
  );
};
