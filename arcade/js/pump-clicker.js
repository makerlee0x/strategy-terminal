/**
 * Pump Clicker — vanilla port of STS gameplay.
 * Mount: StrategyArcade.mountPumpClicker(rootEl)
 */
(function (global) {
  "use strict";

  var SA = global.StrategyArcade;
  var BEST_KEY = "sts-arcade-pump-clicker-best";
  var DURATION_MS = 10000;

  function mountPumpClicker(rootEl) {
    if (!rootEl) return;
    rootEl.innerHTML = "";
    rootEl.classList.add("arcade-game", "arcade-pump");

    var phase = "ready";
    var pumps = 0;
    var best = SA.getBest(BEST_KEY);
    var remaining = DURATION_MS;
    var pumpsRef = 0;
    var endAt = 0;
    var raf = 0;

    var wrap = document.createElement("div");
    wrap.className = "arcade-pump-wrap";

    var panel = document.createElement("div");
    panel.className = "arcade-panel arcade-pump-panel";
    panel.style.touchAction = "manipulation";
    panel.style.position = "relative";
    panel.style.overflow = "hidden";

    var grid = document.createElement("div");
    grid.className = "arcade-pump-grid";
    grid.setAttribute("aria-hidden", "true");
    panel.appendChild(grid);

    var inner = document.createElement("div");
    inner.className = "arcade-pump-inner";

    var topRow = document.createElement("div");
    topRow.className = "arcade-pump-top";

    var mcapBox = document.createElement("div");
    var mcapLabel = document.createElement("p");
    mcapLabel.className = "arcade-eyebrow";
    mcapLabel.textContent = "Live printer mcap";
    var mcapVal = document.createElement("p");
    mcapVal.className = "arcade-phosphor arcade-phosphor-btc arcade-mcap";
    mcapBox.appendChild(mcapLabel);
    mcapBox.appendChild(mcapVal);

    var timerBox = document.createElement("div");
    timerBox.className = "arcade-pump-timer";
    var timerLabel = document.createElement("p");
    timerLabel.className = "arcade-muted";
    var pumpsLabel = document.createElement("p");
    pumpsLabel.className = "arcade-phosphor";
    timerBox.appendChild(timerLabel);
    timerBox.appendChild(pumpsLabel);

    topRow.appendChild(mcapBox);
    topRow.appendChild(timerBox);

    var barWrap = document.createElement("div");
    barWrap.className = "arcade-pump-bar";
    var barFill = document.createElement("div");
    barFill.className = "arcade-pump-bar-fill";
    barWrap.appendChild(barFill);

    var pumpBtn = document.createElement("button");
    pumpBtn.type = "button";
    pumpBtn.className = "arcade-btn arcade-btn-primary arcade-pump-btn";
    pumpBtn.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      onPump();
    });

    var bestLine = document.createElement("p");
    bestLine.className = "arcade-muted arcade-center";

    inner.appendChild(topRow);
    inner.appendChild(barWrap);
    inner.appendChild(pumpBtn);
    inner.appendChild(bestLine);
    panel.appendChild(inner);

    var shareBtn = document.createElement("a");
    shareBtn.href = "#";
    shareBtn.className = "arcade-share";
    shareBtn.target = "_blank";
    shareBtn.rel = "noopener noreferrer";
    shareBtn.textContent = "Share on X";
    shareBtn.hidden = true;
    shareBtn.addEventListener("click", function (e) {
      e.preventDefault();
      SA.openShare(shareText());
    });

    wrap.appendChild(panel);
    wrap.appendChild(shareBtn);
    rootEl.appendChild(wrap);

    function shareText() {
      return SA.buildArcadeShareText({
        gameTitle: "Pump Clicker",
        gamePath: "/play/pump-clicker",
        score: pumps,
        unit: "pumps",
        zeroLead: "Finger on the $STRATEGY printer — Pump Clicker loading 🟢₿",
        scoreLead: function (e) {
          return (
            "Mashed " +
            e +
            " pumps in 10s on Pump Clicker — printer mcap $" +
            (420069 * e).toLocaleString() +
            " 🟢₿"
          );
        }
      });
    }

    function finish() {
      phase = "done";
      SA.setBest(BEST_KEY, pumpsRef);
      best = SA.getBest(BEST_KEY);
      remaining = 0;
      cancelAnimationFrame(raf);
      updateUI();
    }

    function tick() {
      if (phase !== "pumping") return;
      remaining = Math.max(0, endAt - performance.now());
      if (remaining <= 0) {
        finish();
        return;
      }
      updateUI();
      raf = requestAnimationFrame(tick);
    }

    function onPump() {
      if (phase === "ready" || phase === "done") {
        pumpsRef = 0;
        pumps = 0;
        endAt = performance.now() + DURATION_MS;
        remaining = DURATION_MS;
        phase = "pumping";
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(tick);
        updateUI();
        return;
      }
      pumpsRef += 1;
      pumps = pumpsRef;
      updateUI();
    }

    function updateUI() {
      var mcap = (420069 * pumps).toLocaleString();
      var pct = Math.min(100, (pumps / 80) * 100);
      var secs = (remaining / 1000).toFixed(1);

      mcapVal.textContent = "$" + mcap;
      timerLabel.textContent =
        phase === "pumping" ? secs + "s" : phase === "done" ? "Done" : "10.0s";
      pumpsLabel.innerHTML =
        pumps + ' <span class="arcade-muted">pumps</span>';
      barFill.style.width = pct + "%";
      pumpBtn.textContent =
        phase === "ready"
          ? "Tap to start pumping"
          : phase === "pumping"
            ? "PUMP $STRATEGY"
            : "Tap to pump again";
      bestLine.innerHTML =
        'Best <span class="arcade-phosphor-btc">' +
        best +
        "</span> pumps · mash fast · mobile friendly";

      var show = phase === "done" || pumps > 0;
      shareBtn.hidden = !show;
      shareBtn.href = SA.tweetUrl(shareText());
    }

    updateUI();

    return function unmount() {
      cancelAnimationFrame(raf);
      rootEl.innerHTML = "";
    };
  }

  SA.mountPumpClicker = mountPumpClicker;
})(typeof window !== "undefined" ? window : globalThis);
