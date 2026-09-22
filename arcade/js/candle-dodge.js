/**
 * Candle Dodge — vanilla port of STS gameplay.
 * Mount: StrategyArcade.mountCandleDodge(rootEl)
 */
(function (global) {
  "use strict";

  var SA = global.StrategyArcade;
  var BEST_KEY = "sts-arcade-candle-dodge-best";

  function mountCandleDodge(rootEl) {
    if (!rootEl) return;
    rootEl.innerHTML = "";
    rootEl.classList.add("arcade-game", "arcade-candle");

    var score = 0;
    var best = SA.getBest(BEST_KEY);
    var phase = "ready";
    var scoreRef = 0;
    var phaseRef = "ready";
    var laneRef = 1;
    var destroyGame = null;

    var wrap = document.createElement("div");
    wrap.className = "arcade-candle-wrap";

    var stage = document.createElement("div");
    stage.className = "arcade-panel arcade-stage";
    stage.style.touchAction = "none";

    var canvas = document.createElement("canvas");
    canvas.className = "arcade-canvas";
    canvas.style.touchAction = "none";
    canvas.setAttribute(
      "aria-label",
      "Candle Dodge. Tap left or right to change lanes."
    );
    stage.appendChild(canvas);

    var scoreRow = document.createElement("div");
    scoreRow.className = "arcade-score-row";
    var scoreEl = document.createElement("span");
    scoreEl.className = "arcade-phosphor";
    var hintEl = document.createElement("span");
    hintEl.className = "arcade-muted";
    hintEl.textContent = "Tap L / R · swipe";
    scoreRow.appendChild(scoreEl);
    scoreRow.appendChild(hintEl);

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

    wrap.appendChild(stage);
    wrap.appendChild(scoreRow);
    wrap.appendChild(shareBtn);
    rootEl.appendChild(wrap);

    function shareText() {
      return SA.buildArcadeShareText({
        gameTitle: "Candle Dodge",
        gamePath: "/play/candle-dodge",
        score: score,
        zeroLead:
          "Dodging red wicks on Candle Dodge — green only from here 🟢₿",
        scoreLead: function (e) {
          return (
            "Dodged the bears for " +
            e +
            " on Candle Dodge — $STRATEGY chart clearance 🟢₿"
          );
        }
      });
    }

    function updateUI() {
      scoreEl.innerHTML =
        'Score <strong>' +
        score +
        '</strong> · Best <strong class="arcade-phosphor-btc">' +
        best +
        "</strong>";
      var show = phase === "dead" || score > 0;
      shareBtn.hidden = !show;
      shareBtn.href = SA.tweetUrl(shareText());
    }

    function startCanvas() {
      var ctx = canvas.getContext("2d");
      if (!ctx) return;

      var W = 360;
      var H = 480;
      var dpr = 1;
      var raf = 0;
      var alive = true;
      var candles = [];
      var spawnTimer = 40;
      var speed = 3.2;
      var pointerX = 0;
      var bg = "#0b0e11";
      var text = "#f3f5f4";
      var muted = "#8b949e";

      function laneX(lane) {
        var t = (W - 56) / 3;
        return 28 + lane * t + t / 2;
      }

      function resize() {
        W = Math.max(280, Math.floor(stage.getBoundingClientRect().width));
        H = Math.min(560, Math.max(400, Math.floor(1.25 * W)));
        dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        canvas.width = Math.floor(W * dpr);
        canvas.height = Math.floor(H * dpr);
        canvas.style.width = W + "px";
        canvas.style.height = H + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      function reset() {
        candles = [];
        spawnTimer = 40;
        speed = 3.2;
        laneRef = 1;
        scoreRef = 0;
        score = 0;
        updateUI();
      }

      function setPhase(p) {
        phaseRef = p;
        phase = p;
        updateUI();
      }

      function startOrRestart() {
        if (phaseRef === "dead" || phaseRef === "ready") {
          reset();
          setPhase("playing");
        }
      }

      function moveLane(delta) {
        if (phaseRef !== "playing") {
          startOrRestart();
          return;
        }
        laneRef = Math.max(0, Math.min(2, laneRef + delta));
      }

      function onPointerDown(e) {
        e.preventDefault();
        pointerX = e.clientX;
        if (phaseRef !== "playing") {
          startOrRestart();
          return;
        }
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        if (x < rect.width / 3) moveLane(-1);
        else if (x > (2 * rect.width) / 3) moveLane(1);
      }

      function onPointerUp(e) {
        var dx = e.clientX - pointerX;
        if (Math.abs(dx) > 40 && phaseRef === "playing") {
          moveLane(dx > 0 ? 1 : -1);
        }
      }

      function onKey(e) {
        if (e.code === "ArrowLeft" || e.key === "a") {
          e.preventDefault();
          moveLane(-1);
        }
        if (e.code === "ArrowRight" || e.key === "d") {
          e.preventDefault();
          moveLane(1);
        }
        if (e.code === "Space") {
          e.preventDefault();
          startOrRestart();
        }
      }

      var ro = new ResizeObserver(function () {
        resize();
      });
      ro.observe(stage);
      resize();
      reset();
      setPhase("ready");
      canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
      canvas.addEventListener("pointerup", onPointerUp);
      window.addEventListener("keydown", onKey);

      function frame() {
        if (!alive) return;

        if (phaseRef === "playing") {
          speed = Math.min(7, 3.2 + 0.04 * scoreRef);
          spawnTimer -= 1;
          if (spawnTimer <= 0) {
            var lane = Math.floor(3 * Math.random());
            var r = Math.random();
            var kind = r < 0.55 ? "red" : r < 0.88 ? "green" : "btc";
            var colW = (W - 56) / 3;
            candles.push({
              x: laneX(lane) - 14,
              y: -40,
              w: Math.min(36, 0.55 * colW),
              h: kind === "btc" ? 28 : 40,
              kind: kind
            });
            spawnTimer = Math.max(28, 70 - scoreRef);
          }

          var py = H - 56;
          for (var i = 0; i < candles.length; i++) {
            var c = candles[i];
            c.y += speed;
            var cx = c.x + c.w / 2;
            var cy = c.y + c.h / 2;
            var dx = cx - laneX(laneRef);
            var dy = cy - py;
            if (dx * dx + dy * dy < 484) {
              if (c.kind === "red") {
                setPhase("dead");
                SA.setBest(BEST_KEY, scoreRef);
                best = SA.getBest(BEST_KEY);
                updateUI();
              } else {
                c.y = H + 100;
                scoreRef += c.kind === "btc" ? 3 : 1;
                score = scoreRef;
                updateUI();
              }
            }
          }
          candles = candles.filter(function (e) {
            return e.y < H + 60;
          });
          if (0.02 > Math.random()) scoreRef += 0;
        }

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = "#1e242c";
        for (var lane = 1; lane < 3; lane++) {
          var lx = 28 + ((W - 56) / 3) * lane;
          ctx.beginPath();
          ctx.moveTo(lx, 0);
          ctx.lineTo(lx, H);
          ctx.stroke();
        }
        ctx.globalAlpha = 0.5;
        for (var gy = 0; gy < H; gy += 36) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(W, gy);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        for (var ci = 0; ci < candles.length; ci++) {
          var e = candles[ci];
          ctx.fillStyle =
            e.kind === "green"
              ? "#3dff9a"
              : e.kind === "btc"
                ? "#f7931a"
                : "#8a6a5a";
          if (e.kind === "btc") {
            ctx.beginPath();
            ctx.arc(e.x + e.w / 2, e.y + e.h / 2, 12, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = bg;
            ctx.font = "700 11px Anonymous Pro, monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("₿", e.x + e.w / 2, e.y + e.h / 2 + 1);
          } else {
            ctx.fillRect(e.x + e.w / 2 - 1, e.y - 8, 2, e.h + 16);
            ctx.fillRect(e.x, e.y, e.w, 0.7 * e.h);
          }
        }

        var px = laneX(laneRef);
        var playerY = H - 56;
        ctx.fillStyle = "#f7931a";
        ctx.beginPath();
        ctx.arc(px, playerY, 16, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = bg;
        ctx.font = "700 12px Anonymous Pro, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("₿", px, playerY + 1);

        ctx.fillStyle = text;
        ctx.font = "700 26px Anonymous Pro, ChicagoFLF, monospace";
        ctx.textAlign = "left";
        ctx.fillText(String(scoreRef), 14, 36);
        ctx.fillStyle = muted;
        ctx.font = "500 11px Anonymous Pro, monospace";
        ctx.fillText("BEST " + SA.getBest(BEST_KEY), 14, 54);

        if (phaseRef !== "playing") {
          ctx.fillStyle = "rgba(11,14,17,0.72)";
          ctx.fillRect(24, 0.3 * H, W - 48, 80);
          ctx.fillStyle = text;
          ctx.font = "700 16px Anonymous Pro, ChicagoFLF, monospace";
          ctx.textAlign = "center";
          ctx.fillText(
            phaseRef === "dead" ? "Wick'd" : "Dodge the reds",
            W / 2,
            0.3 * H + 34
          );
          ctx.fillStyle = muted;
          ctx.font = "500 12px Anonymous Pro, monospace";
          ctx.fillText("Tap sides · collect green", W / 2, 0.3 * H + 56);
        }

        raf = requestAnimationFrame(frame);
      }

      raf = requestAnimationFrame(frame);

      destroyGame = function () {
        alive = false;
        cancelAnimationFrame(raf);
        ro.disconnect();
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("keydown", onKey);
      };
    }

    updateUI();
    startCanvas();

    return function unmount() {
      if (destroyGame) destroyGame();
      rootEl.innerHTML = "";
    };
  }

  SA.mountCandleDodge = mountCandleDodge;
})(typeof window !== "undefined" ? window : globalThis);
