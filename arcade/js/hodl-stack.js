/**
 * HODL Stack — vanilla port of STS gameplay.
 * Mount: StrategyArcade.mountHodlStack(rootEl)
 */
(function (global) {
  "use strict";

  var SA = global.StrategyArcade;
  var roundRect = SA.roundRect;
  var BEST_KEY = "sts-arcade-hodl-stack-best";

  function mountHodlStack(rootEl) {
    if (!rootEl) return;
    rootEl.innerHTML = "";
    rootEl.classList.add("arcade-game", "arcade-hodl");

    var score = 0;
    var best = SA.getBest(BEST_KEY);
    var phase = "ready";
    var scoreRef = 0;
    var phaseRef = "ready";
    var dropFn = null;
    var destroyGame = null;

    var wrap = document.createElement("div");
    wrap.className = "arcade-hodl-wrap";

    var stage = document.createElement("div");
    stage.className = "arcade-panel arcade-stage";
    stage.style.touchAction = "none";

    var canvas = document.createElement("canvas");
    canvas.className = "arcade-canvas";
    canvas.style.touchAction = "none";
    canvas.setAttribute("aria-label", "HODL Stack. Tap to drop blocks.");

    stage.appendChild(canvas);

    var scoreRow = document.createElement("div");
    scoreRow.className = "arcade-score-row";
    var scoreEl = document.createElement("span");
    scoreEl.className = "arcade-phosphor";
    var hintEl = document.createElement("span");
    hintEl.className = "arcade-muted";
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
        gameTitle: "HODL Stack",
        gamePath: "/play/hodl-stack",
        score: score,
        unit: "stacks",
        zeroLead: "Building the $STRATEGY tower — one more drop 🟢₿",
        scoreLead: function (e) {
          return (
            "Stacked " + e + " bags on HODL Stack — tower looking thicc 🟢₿"
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
      hintEl.textContent = phase === "dead" ? "Tap to retry" : "Tap to drop";
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
      var stack = [];
      var mover = { x: 0, w: 120, dir: 1, speed: 2.4 };
      var camY = 0;
      var accent = "#3dff9a";
      var text = "#f3f5f4";
      var muted = "#8b949e";

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
        stack = [
          {
            x: 0.5 * W - 70,
            w: 140,
            y: H - 80,
            tone: "btc"
          }
        ];
        mover = { x: 20, w: 140, dir: 1, speed: 2.4 };
        camY = 0;
        scoreRef = 0;
        score = 0;
        updateUI();
      }

      function setPhase(p) {
        phaseRef = p;
        phase = p;
        updateUI();
      }

      function drop() {
        if (phaseRef === "dead" || phaseRef === "ready") {
          reset();
          setPhase("playing");
          return;
        }
        var last = stack[stack.length - 1];
        var left = Math.max(mover.x, last.x);
        var overlap = Math.min(mover.x + mover.w, last.x + last.w) - left;
        if (overlap < 12) {
          setPhase("dead");
          SA.setBest(BEST_KEY, scoreRef);
          best = SA.getBest(BEST_KEY);
          updateUI();
          return;
        }
        var tone =
          scoreRef % 3 === 0 ? "strat" : scoreRef % 2 === 0 ? "btc" : "gold";
        var y = last.y - 22;
        stack.push({ x: left, w: overlap, y: y, tone: tone });
        mover.w = overlap;
        mover.x = mover.dir > 0 ? 8 : W - overlap - 8;
        mover.speed = Math.min(5.2, 2.4 + 0.08 * scoreRef);
        scoreRef += 1;
        score = scoreRef;
        camY = Math.max(0, H - 140 - y);
        updateUI();
      }

      dropFn = drop;

      function onPointer(e) {
        e.preventDefault();
        drop();
      }

      var ro = new ResizeObserver(function () {
        resize();
      });
      ro.observe(stage);
      resize();
      reset();
      setPhase("ready");
      canvas.addEventListener("pointerdown", onPointer, { passive: false });

      function frame() {
        if (!alive) return;
        if (phaseRef === "playing") {
          mover.x += mover.dir * mover.speed;
          if (mover.x <= 8) {
            mover.x = 8;
            mover.dir = 1;
          }
          if (mover.x + mover.w >= W - 8) {
            mover.x = W - 8 - mover.w;
            mover.dir = -1;
          }
        }

        ctx.fillStyle = "#0b0e11";
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = "#1e242c";
        ctx.globalAlpha = 0.7;
        for (var gy = 40; gy < H; gy += 32) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(W, gy);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.translate(0, camY);
        for (var i = 0; i < stack.length; i++) {
          var blk = stack[i];
          var tone = blk.tone;
          ctx.fillStyle =
            tone === "btc" ? "#f7931a" : tone === "strat" ? accent : "#f0c14a";
          roundRect(ctx, blk.x, blk.y, blk.w, 20, 4);
          ctx.fill();
        }
        if (phaseRef === "playing" || phaseRef === "ready") {
          var my = stack[stack.length - 1].y - 22;
          ctx.fillStyle = accent;
          ctx.globalAlpha = 0.95;
          roundRect(ctx, mover.x, my, mover.w, 20, 4);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.restore();

        ctx.fillStyle = text;
        ctx.font = "700 26px Anonymous Pro, ChicagoFLF, monospace";
        ctx.textAlign = "left";
        ctx.fillText(String(scoreRef), 14, 36);
        ctx.fillStyle = muted;
        ctx.font = "500 11px Anonymous Pro, monospace";
        ctx.fillText("BEST " + SA.getBest(BEST_KEY), 14, 54);

        if (phaseRef !== "playing") {
          ctx.fillStyle = "rgba(11,14,17,0.72)";
          ctx.fillRect(0, 0.32 * H, W, 72);
          ctx.fillStyle = text;
          ctx.font = "700 16px Anonymous Pro, ChicagoFLF, monospace";
          ctx.textAlign = "center";
          ctx.fillText(
            phaseRef === "dead" ? "Stack collapsed" : "Tap to drop",
            W / 2,
            0.32 * H + 32
          );
          ctx.fillStyle = muted;
          ctx.font = "500 12px Anonymous Pro, monospace";
          ctx.fillText(
            phaseRef === "dead" ? "Tap to restack" : "HODL the ledge",
            W / 2,
            0.32 * H + 54
          );
        }

        raf = requestAnimationFrame(frame);
      }

      raf = requestAnimationFrame(frame);

      destroyGame = function () {
        alive = false;
        cancelAnimationFrame(raf);
        ro.disconnect();
        canvas.removeEventListener("pointerdown", onPointer);
        dropFn = null;
      };
    }

    updateUI();
    startCanvas();

    return function unmount() {
      if (destroyGame) destroyGame();
      rootEl.innerHTML = "";
    };
  }

  SA.mountHodlStack = mountHodlStack;
})(typeof window !== "undefined" ? window : globalThis);
