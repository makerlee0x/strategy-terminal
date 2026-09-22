/**
 * Shared helpers for strategycoin.io arcade ports.
 * Exposes window.StrategyArcade.
 */
(function (global) {
  "use strict";

  var STS_PLAY_ORIGIN = "https://stocktokenswap.com";
  var LEADERBOARD_URL = "https://stocktokenswap.com/api/play/leaderboard";

  var CRT = {
    bg: "#0b0e11",
    elevated: "#121814",
    soft: "#151a16",
    border: "#2c342e",
    text: "#e8f0e4",
    muted: "#8a9488",
    positive: "#A9BA9C",
    accent: "#8FCF9A",
    negative: "#D9232E",
    btc: "#f7931a",
    mstr: "#D9232E"
  };

  function buildArcadeShareText(opts) {
    opts = opts || {};
    var score = Math.max(0, Math.floor(opts.score || 0));
    var beat = "Beat me: " + STS_PLAY_ORIGIN + (opts.gamePath || "");
    var tags = "$STRATEGY $MSTR $BTC\n@strategystock";
    var lead;
    if (score <= 0) {
      lead =
        opts.zeroLead ||
        "Warming up on " + (opts.gameTitle || "arcade") + " — next run prints 🟢₿";
    } else if (typeof opts.scoreLead === "function") {
      lead = opts.scoreLead(score);
    } else {
      lead =
        "Just printed " +
        score +
        (opts.unit ? " " + opts.unit : "") +
        " on " +
        (opts.gameTitle || "arcade") +
        " 🟢₿";
    }
    return [lead, beat, tags].join("\n");
  }

  function tweetUrl(text) {
    return "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text);
  }

  function openShare(text) {
    global.open(tweetUrl(text), "_blank", "noopener,noreferrer");
  }

  function getBest(key) {
    try {
      var n = Number(localStorage.getItem(key));
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    } catch (e) {
      return 0;
    }
  }

  function setBest(key, score) {
    try {
      var prev = getBest(key);
      if (score > prev) localStorage.setItem(key, String(score));
    } catch (e) {}
  }

  function roundRect(ctx, x, y, w, h, r) {
    var rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function hexAlpha(hex, a) {
    var h = String(hex || "")
      .replace("#", "")
      .trim();
    if (h.length === 6) {
      var r = parseInt(h.slice(0, 2), 16);
      var g = parseInt(h.slice(2, 4), 16);
      var b = parseInt(h.slice(4, 6), 16);
      return "rgba(" + r + "," + g + "," + b + "," + a + ")";
    }
    return hex;
  }

  function el(tag, className, attrs) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") node.textContent = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k === "style" && typeof attrs[k] === "object") {
          Object.assign(node.style, attrs[k]);
        } else if (k.slice(0, 2) === "on" && typeof attrs[k] === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
      });
    }
    return node;
  }

  var api = global.StrategyArcade || {};
  api.STS_PLAY_ORIGIN = STS_PLAY_ORIGIN;
  api.LEADERBOARD_URL = LEADERBOARD_URL;
  api.CRT = CRT;
  api.buildArcadeShareText = buildArcadeShareText;
  api.tweetUrl = tweetUrl;
  api.openShare = openShare;
  api.getBest = getBest;
  api.setBest = setBest;
  api.roundRect = roundRect;
  api.hexAlpha = hexAlpha;
  api.el = el;
  global.StrategyArcade = api;
})(typeof window !== "undefined" ? window : globalThis);
