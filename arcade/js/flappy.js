/**
 * Flappy STRATEGY — vanilla port of STS gameplay.
 * Mount: StrategyArcade.mountFlappy(rootEl)
 */
(function (global) {
  "use strict";

  var SA = global.StrategyArcade;
  var CRT = SA.CRT;
  var hexAlpha = SA.hexAlpha;
  var roundRect = SA.roundRect;
  var LEADERBOARD_URL = SA.LEADERBOARD_URL;

  var BEST_KEY = "sts-flappy-strategy-best";
  var DIFF_KEY = "sts-flappy-strategy-diff";
  var TUTORIAL_KEY = "sts-flappy-strategy-tutorial-done";
  var NAME_KEY = "sts-flappy-strategy-name";
  var SHARE_URL = "https://stocktokenswap.com/play/flappy";

  var DIFFS = {
    easy: {
      id: "easy",
      label: "Easy",
      gap: 198,
      speed: 1.85,
      gravity: 0.28,
      flap: -6.1,
      spawnEvery: 118,
      pickupChance: 0.58
    },
    normal: {
      id: "normal",
      label: "Normal",
      gap: 168,
      speed: 2.2,
      gravity: 0.34,
      flap: -6.6,
      spawnEvery: 104,
      pickupChance: 0.5
    },
    hard: {
      id: "hard",
      label: "Hard",
      gap: 124,
      speed: 3.05,
      gravity: 0.5,
      flap: -7.7,
      spawnEvery: 84,
      pickupChance: 0.4
    }
  };

  function getBestDiff(diff) {
    try {
      var t = localStorage.getItem(BEST_KEY + ":" + diff);
      var n = Number(t);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    } catch (e) {
      return 0;
    }
  }

  function setBestDiff(diff, score) {
    try {
      localStorage.setItem(BEST_KEY + ":" + diff, String(score));
    } catch (e) {}
  }

  function setTutorialDone(done) {
    try {
      if (done) localStorage.setItem(TUTORIAL_KEY, "1");
      else localStorage.removeItem(TUTORIAL_KEY);
    } catch (e) {}
  }

  function isTutorialDone() {
    try {
      return localStorage.getItem(TUTORIAL_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function loadDiff() {
    try {
      var e = localStorage.getItem(DIFF_KEY);
      if (e === "easy" || e === "normal" || e === "hard") return e;
    } catch (e) {}
    return "normal";
  }

  function loadName() {
    try {
      var e = localStorage.getItem(NAME_KEY);
      return e ? e.trim().slice(0, 24) : "";
    } catch (e) {
      return "";
    }
  }

  /** Flappy-specific share copy — never leads with a scored 0. */
  function buildShareText(score, difficulty) {
    var l = Math.max(0, Math.floor(score));
    var hard = difficulty === "hard";
    var n = [
      l <= 0
        ? difficulty === "easy"
          ? "Tapping through the $STRATEGY chart — next run’s the one 🟢₿"
          : hard
            ? "Hard mode almost ate me. Loading another Flappy STRATEGY attempt 🟢₿"
            : "Trying to HODL the chart on Flappy STRATEGY — candles almost got me 🟢₿"
        : l >= 40
          ? hard
            ? "Absolute demon run — " + l + " on HARD Flappy STRATEGY 🟢₿"
            : "Just cooked a " + l + " on Flappy STRATEGY 🟢₿ chart god mode"
          : l >= 15
            ? hard
              ? "Ripped " + l + " on HARD through the $STRATEGY candles 🟢₿"
              : "Just ripped " + l + " through the $STRATEGY chart 🟢₿"
            : hard
              ? "Stacked " + l + " on HARD Flappy STRATEGY — still going 🟢₿"
              : "Cleared " + l + " on Flappy STRATEGY — green candles only 🟢₿",
      "Beat me: " + SHARE_URL,
      "$STRATEGY $MSTR $BTC\n@strategystock"
    ].join("\n");
    if (n.length > 260) {
      return [
        l > 0
          ? "Ripped " + l + " on Flappy STRATEGY 🟢₿"
          : "HODLing the chart on Flappy STRATEGY 🟢₿",
        SHARE_URL,
        "$STRATEGY $MSTR $BTC @strategystock"
      ].join("\n");
    }
    return n;
  }

  function mountFlappy(rootEl) {
    if (!rootEl) return;
    rootEl.innerHTML = "";
    rootEl.classList.add("arcade-game", "arcade-flappy");

    var difficulty = loadDiff();
    var boardDiff = difficulty;
    var phase = "ready";
    var score = 0;
    var best = getBestDiff(difficulty);
    var runMeta = null;
    var nameValue = loadName();
    var submitState = "idle";
    var submitMsg = "";
    var lbScores = [];
    var lbLoading = false;
    var lbError = "";
    var toastId = 0;
    var showTutorial = !isTutorialDone();

    var pipeCount = 0;
    var pickupCount = 0;
    var scoreLive = 0;
    var bestLive = best;
    var startTs = 0;
    var phaseRef = "ready";
    var diffRef = difficulty;
    var flapFn = null;
    var setDiffFn = null;
    var destroyGame = null;

    // ——— DOM ———
    var wrap = document.createElement("div");
    wrap.className = "arcade-flappy-wrap";

    var topBar = document.createElement("div");
    topBar.className = "arcade-toolbar";

    var diffGroup = document.createElement("div");
    diffGroup.className = "arcade-chip-group";
    diffGroup.setAttribute("role", "group");
    diffGroup.setAttribute("aria-label", "Difficulty");

    var diffBtns = {};
    ["easy", "normal", "hard"].forEach(function (id) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "arcade-chip" + (difficulty === id ? " is-active" : "");
      btn.textContent = DIFFS[id].label;
      btn.dataset.diff = id;
      btn.addEventListener("click", function () {
        if (phase === "playing") return;
        try {
          localStorage.setItem(DIFF_KEY, id);
        } catch (e) {}
        difficulty = id;
        boardDiff = id;
        Object.keys(diffBtns).forEach(function (k) {
          diffBtns[k].classList.toggle("is-active", k === id);
        });
        Object.keys(boardDiffBtns).forEach(function (k) {
          boardDiffBtns[k].classList.toggle("is-active", k === id);
        });
        best = getBestDiff(id);
        bestLive = best;
        updateScoreboard();
        if (setDiffFn) setDiffFn(id);
        loadLeaderboard(id);
        syncBoardTabs();
      });
      diffBtns[id] = btn;
      diffGroup.appendChild(btn);
    });

    var tickerHint = document.createElement("span");
    tickerHint.className = "arcade-muted arcade-hide-sm";
    tickerHint.textContent = "$STRATEGY · $MSTR · $BTC";

    var tutorialBtn = document.createElement("button");
    tutorialBtn.type = "button";
    tutorialBtn.className = "arcade-btn arcade-btn-ghost arcade-ml-auto";
    tutorialBtn.textContent = "Tutorial";
    tutorialBtn.addEventListener("click", function () {
      setTutorialDone(false);
      showTutorial = true;
      renderTutorial();
    });

    topBar.appendChild(diffGroup);
    topBar.appendChild(tickerHint);
    topBar.appendChild(tutorialBtn);

    var layout = document.createElement("div");
    layout.className = "arcade-layout arcade-layout-split";

    var mainCol = document.createElement("div");
    mainCol.className = "arcade-main";

    var stage = document.createElement("div");
    stage.className = "arcade-panel arcade-stage";
    stage.style.touchAction = "none";
    stage.style.webkitUserSelect = "none";

    var canvas = document.createElement("canvas");
    canvas.className = "arcade-canvas";
    canvas.style.touchAction = "none";
    canvas.style.webkitTouchCallout = "none";
    canvas.style.userSelect = "none";
    canvas.setAttribute("role", "img");
    canvas.setAttribute(
      "aria-label",
      "Flappy STRATEGY game canvas. Tap or press space to flap."
    );

    var toastLayer = document.createElement("div");
    toastLayer.className = "arcade-toasts";

    var tutorialLayer = document.createElement("div");
    tutorialLayer.className = "arcade-tutorial";

    stage.appendChild(canvas);
    stage.appendChild(toastLayer);
    stage.appendChild(tutorialLayer);

    var scoreRow = document.createElement("div");
    scoreRow.className = "arcade-score-row";
    var scoreCells = document.createElement("p");
    scoreCells.className = "arcade-phosphor";
    var hintEl = document.createElement("p");
    hintEl.className = "arcade-muted";
    scoreRow.appendChild(scoreCells);
    scoreRow.appendChild(hintEl);

    var sharePanel = document.createElement("div");
    sharePanel.className = "arcade-panel arcade-share-panel";
    sharePanel.hidden = true;

    var shareBtn = document.createElement("a");
    shareBtn.href = "#";
    shareBtn.className = "arcade-share";
    shareBtn.target = "_blank";
    shareBtn.rel = "noopener noreferrer";
    shareBtn.textContent = "Share score on X";
    shareBtn.addEventListener("click", function (e) {
      e.preventDefault();
      var text = buildShareText(score, difficulty);
      SA.openShare(text);
    });

    var submitRow = document.createElement("div");
    submitRow.className = "arcade-submit-row";
    submitRow.hidden = true;

    var nameLabel = document.createElement("label");
    nameLabel.className = "arcade-label";
    nameLabel.textContent = "Name";
    var nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.maxLength = 24;
    nameInput.className = "arcade-input";
    nameInput.placeholder = "Display name";
    nameInput.autocomplete = "nickname";
    nameInput.value = nameValue;
    nameInput.addEventListener("input", function () {
      nameValue = nameInput.value;
    });
    nameLabel.appendChild(nameInput);

    var submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.className = "arcade-btn arcade-btn-primary";
    submitBtn.textContent = "Submit";
    submitBtn.addEventListener("click", function () {
      submitScore();
    });

    submitRow.appendChild(nameLabel);
    submitRow.appendChild(submitBtn);

    var submitMsgEl = document.createElement("p");
    submitMsgEl.className = "arcade-submit-msg";
    submitMsgEl.hidden = true;

    sharePanel.appendChild(shareBtn);
    sharePanel.appendChild(submitRow);
    sharePanel.appendChild(submitMsgEl);

    mainCol.appendChild(stage);
    mainCol.appendChild(scoreRow);
    mainCol.appendChild(sharePanel);

    // Leaderboard
    var lbSection = document.createElement("section");
    lbSection.className = "arcade-lb arcade-panel";
    lbSection.setAttribute("aria-labelledby", "flappy-lb-heading");

    var lbHead = document.createElement("div");
    lbHead.className = "arcade-lb-head";
    var lbTitle = document.createElement("h2");
    lbTitle.id = "flappy-lb-heading";
    lbTitle.className = "arcade-lb-title";
    lbTitle.textContent = "Leaderboard";
    var refreshBtn = document.createElement("button");
    refreshBtn.type = "button";
    refreshBtn.className = "arcade-btn arcade-btn-ghost";
    refreshBtn.textContent = "Refresh";
    refreshBtn.addEventListener("click", function () {
      loadLeaderboard(boardDiff);
    });
    lbHead.appendChild(lbTitle);
    lbHead.appendChild(refreshBtn);

    var boardTabs = document.createElement("div");
    boardTabs.className = "arcade-chip-group";
    boardTabs.setAttribute("role", "tablist");
    boardTabs.setAttribute("aria-label", "Board difficulty");
    var boardDiffBtns = {};
    ["easy", "normal", "hard", "all"].forEach(function (id) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "arcade-chip" + (boardDiff === id ? " is-active" : "");
      btn.setAttribute("role", "tab");
      btn.textContent = id;
      btn.addEventListener("click", function () {
        boardDiff = id;
        syncBoardTabs();
        loadLeaderboard(id);
      });
      boardDiffBtns[id] = btn;
      boardTabs.appendChild(btn);
    });

    var lbErrEl = document.createElement("p");
    lbErrEl.className = "arcade-error";
    lbErrEl.hidden = true;

    var lbList = document.createElement("ol");
    lbList.className = "arcade-lb-list";

    lbSection.appendChild(lbHead);
    lbSection.appendChild(boardTabs);
    lbSection.appendChild(lbErrEl);
    lbSection.appendChild(lbList);

    layout.appendChild(mainCol);
    layout.appendChild(lbSection);

    wrap.appendChild(topBar);
    wrap.appendChild(layout);
    rootEl.appendChild(wrap);

    function syncBoardTabs() {
      Object.keys(boardDiffBtns).forEach(function (k) {
        boardDiffBtns[k].classList.toggle("is-active", k === boardDiff);
        boardDiffBtns[k].setAttribute("aria-selected", k === boardDiff ? "true" : "false");
      });
    }

    function updateScoreboard() {
      scoreCells.innerHTML =
        'Score <span class="arcade-phosphor-val">' +
        score +
        '</span><span class="arcade-dot">·</span>Best <span class="arcade-phosphor-btc">' +
        best +
        "</span>";
      hintEl.textContent =
        phase === "dead"
          ? "Tap to restart"
          : phase === "playing"
            ? "Dodge · collect"
            : "Tap to start";
      var showShare = phase === "dead" || (phase === "playing" && score > 0);
      sharePanel.hidden = !showShare;
      submitRow.hidden = !(phase === "dead" && score > 0);
      shareBtn.href = SA.tweetUrl(buildShareText(score, difficulty));
      Object.keys(diffBtns).forEach(function (k) {
        diffBtns[k].disabled = phase === "playing";
        diffBtns[k].classList.toggle("is-active", difficulty === k);
      });
    }

    function pushToast(text) {
      var id = ++toastId;
      var node = document.createElement("div");
      node.className = "arcade-toast";
      node.dataset.id = String(id);
      node.textContent = text;
      toastLayer.appendChild(node);
      setTimeout(function () {
        if (node.parentNode) node.parentNode.removeChild(node);
      }, 1800);
    }

    function renderTutorial() {
      tutorialLayer.innerHTML = "";
      if (!showTutorial) {
        tutorialLayer.hidden = true;
        return;
      }
      tutorialLayer.hidden = false;
      var card = document.createElement("div");
      card.className = "arcade-panel arcade-tutorial-card";
      card.innerHTML =
        '<p class="arcade-eyebrow">How to play</p>' +
        "<h2>Flappy STRATEGY</h2>" +
        "<ul>" +
        "<li><strong>Tap anywhere</strong> to flap.</li>" +
        "<li>Fly through <strong class=\"text-positive\">green</strong> & <strong class=\"text-btc\">gold</strong> candle gaps.</li>" +
        "<li>Collect ₿ / trophies for bonus points.</li>" +
        "<li>Your flight draws a <strong class=\"text-accent\">green chart line</strong>.</li>" +
        "</ul>";
      var got = document.createElement("button");
      got.type = "button";
      got.className = "arcade-btn arcade-btn-primary";
      got.textContent = "Got it — let’s fly";
      got.addEventListener("click", function () {
        setTutorialDone(true);
        showTutorial = false;
        renderTutorial();
      });
      var skip = document.createElement("button");
      skip.type = "button";
      skip.className = "arcade-btn arcade-btn-ghost";
      skip.textContent = "Skip for now";
      skip.addEventListener("click", function () {
        showTutorial = false;
        renderTutorial();
      });
      var actions = document.createElement("div");
      actions.className = "arcade-tutorial-actions";
      actions.appendChild(got);
      actions.appendChild(skip);
      card.appendChild(actions);
      tutorialLayer.appendChild(card);
    }

    function renderLb() {
      refreshBtn.disabled = lbLoading;
      refreshBtn.textContent = lbLoading ? "…" : "Refresh";
      lbErrEl.hidden = !lbError;
      lbErrEl.textContent = lbError;
      lbList.innerHTML = "";
      if (!lbScores.length && !lbLoading) {
        var empty = document.createElement("li");
        empty.className = "arcade-lb-empty";
        empty.textContent = "No scores yet.";
        lbList.appendChild(empty);
        return;
      }
      lbScores.forEach(function (row, idx) {
        var li = document.createElement("li");
        li.className = "arcade-lb-row";
        li.innerHTML =
          '<span class="arcade-lb-rank">' +
          (idx + 1) +
          '</span><span class="arcade-lb-name">' +
          escapeHtml(row.name) +
          '</span><span class="arcade-lb-diff">' +
          escapeHtml(row.difficulty || "") +
          '</span><span class="arcade-lb-score">' +
          row.score +
          "</span>";
        lbList.appendChild(li);
      });
    }

    function escapeHtml(s) {
      return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    async function loadLeaderboard(diff) {
      lbLoading = true;
      lbError = "";
      renderLb();
      try {
        var res = await fetch(
          LEADERBOARD_URL + "?limit=40&difficulty=" + encodeURIComponent(diff),
          { cache: "no-store" }
        );
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load board");
        lbScores = data.scores || [];
      } catch (e) {
        lbError = e instanceof Error ? e.message : "Failed to load board";
      } finally {
        lbLoading = false;
        renderLb();
      }
    }

    async function submitScore() {
      if (!runMeta || score <= 0) return;
      var name = nameValue.trim();
      if (name.length < 2) {
        submitState = "err";
        submitMsg = "Enter a display name (2–24 chars).";
        updateSubmitUI();
        return;
      }
      try {
        localStorage.setItem(NAME_KEY, name.slice(0, 24));
      } catch (e) {}
      submitState = "submitting";
      submitMsg = "";
      updateSubmitUI();
      try {
        var res = await fetch(LEADERBOARD_URL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: name,
            score: score,
            durationMs: runMeta.durationMs,
            difficulty: difficulty,
            pipes: runMeta.pipes,
            pickups: runMeta.pickups
          })
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || "Submit failed");
        submitState = "ok";
        submitMsg = "On the board!";
        if (data.scores) {
          lbScores = data.scores;
          renderLb();
        } else {
          loadLeaderboard(boardDiff);
        }
      } catch (e) {
        submitState = "err";
        submitMsg = e instanceof Error ? e.message : "Submit failed";
      }
      updateSubmitUI();
    }

    function updateSubmitUI() {
      submitBtn.disabled = submitState === "submitting" || submitState === "ok";
      submitBtn.textContent =
        submitState === "submitting"
          ? "…"
          : submitState === "ok"
            ? "Submitted"
            : "Submit";
      submitMsgEl.hidden = !submitMsg;
      submitMsgEl.textContent = submitMsg;
      submitMsgEl.className =
        "arcade-submit-msg" +
        (submitState === "err" ? " is-err" : " is-ok");
    }

    // ——— Canvas game loop ———
    function startCanvas() {
      var ctx = canvas.getContext("2d");
      if (!ctx) return;
      var birdImg = new Image();
      birdImg.src = "/assets/arcade/flappy-btc.png";
      var trophyImg = new Image();
      trophyImg.src = "/assets/arcade/strategy-trophy.png";

      var W = 360;
      var H = 520;
      var dpr = 1;
      var bird = { x: 72, y: 218.4, vy: 0, r: 18, rot: 0 };
      var pipes = [];
      var pickups = [];
      var trail = [];
      var groundY = 464;
      var scrollX = 0;
      var spawnTimer = 0;
      var flash = 0;
      var lockScroll = false;
      var alive = true;
      var raf = 0;
      var palette = CRT;

      function cfg() {
        return DIFFS[diffRef];
      }

      function resize() {
        var rect = stage.getBoundingClientRect();
        var vw =
          (window.visualViewport && window.visualViewport.width) ||
          window.innerWidth;
        var vh =
          (window.visualViewport && window.visualViewport.height) ||
          window.innerHeight;
        W = Math.max(280, Math.floor(Math.min(rect.width, vw)));
        H = Math.min(
          Math.min(640, Math.max(380, Math.floor(0.58 * vh))),
          Math.max(400, Math.floor(1.28 * W))
        );
        dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        canvas.width = Math.floor(W * dpr);
        canvas.height = Math.floor(H * dpr);
        canvas.style.width = W + "px";
        canvas.style.height = H + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        groundY = H - 56;
        if (phaseRef === "ready") {
          bird.y = 0.42 * H;
          bird.vy = 0;
          bird.rot = 0;
        }
      }

      function setBodyLock(on) {
        if (on === lockScroll) return;
        lockScroll = on;
        if (on) {
          document.documentElement.style.overflow = "hidden";
          document.body.style.overflow = "hidden";
          document.body.style.touchAction = "none";
        } else {
          document.documentElement.style.overflow = "";
          document.body.style.overflow = "";
          document.body.style.touchAction = "";
        }
      }

      function resetRun() {
        bird.x = Math.min(88, 0.22 * W);
        bird.y = 0.42 * H;
        bird.vy = 0;
        bird.rot = 0;
        pipes = [];
        pickups = [];
        trail = [];
        scrollX = 0;
        spawnTimer = 36;
        flash = 0;
        pipeCount = 0;
        pickupCount = 0;
        scoreLive = 0;
        score = 0;
        runMeta = null;
        submitState = "idle";
        submitMsg = "";
        updateSubmitUI();
        updateScoreboard();
      }

      function setPhase(p) {
        phaseRef = p;
        phase = p;
        setBodyLock(p === "playing");
        updateScoreboard();
      }

      function flap() {
        if (phaseRef === "dead") {
          resetRun();
          setPhase("playing");
          startTs = performance.now();
          bird.vy = cfg().flap;
          return;
        }
        if (phaseRef === "ready") {
          resetRun();
          setPhase("playing");
          startTs = performance.now();
        }
        bird.vy = cfg().flap;
      }

      flapFn = flap;
      setDiffFn = function (id) {
        diffRef = id;
        difficulty = id;
        bestLive = getBestDiff(id);
        best = bestLive;
        if (phaseRef !== "playing") {
          resetRun();
          setPhase("ready");
        }
      };

      function drawBanner(title, sub) {
        var bw = Math.min(300, W - 28);
        var by = 0.3 * H;
        roundRect(ctx, (W - bw) / 2, by, bw, 78, 14);
        ctx.fillStyle = palette.elevated;
        ctx.globalAlpha = 0.94;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = hexAlpha(palette.btc, 0.45);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.textAlign = "center";
        ctx.fillStyle = palette.text;
        ctx.font = "700 17px Anonymous Pro, ChicagoFLF, monospace";
        ctx.fillText(title, W / 2, by + 34);
        ctx.fillStyle = palette.muted;
        ctx.font = "500 12px Anonymous Pro, ChicagoFLF, monospace";
        ctx.fillText(sub, W / 2, by + 56);
      }

      function onPointer(e) {
        e.preventDefault();
        flap();
      }
      function onTouchMove(e) {
        if (phaseRef === "playing" || e.target === canvas) e.preventDefault();
      }
      function onKey(e) {
        if (e.code === "Space" || e.code === "ArrowUp" || e.key === " ") {
          e.preventDefault();
          flap();
        }
        if (e.code === "KeyR" && phaseRef === "dead") flap();
      }

      var ro = new ResizeObserver(function () {
        resize();
      });
      ro.observe(stage);
      resize();
      resetRun();
      setPhase("ready");

      canvas.addEventListener("pointerdown", onPointer, { passive: false });
      stage.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("keydown", onKey);
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", resize);
      }

      function spawnPipe() {
        var c = cfg();
        var gap = c.gap;
        var gapY = 64 + Math.random() * Math.max(40, groundY - 128 - gap);
        var a = Math.random();
        pipes.push({
          x: W + 24,
          gapY: gapY,
          gapH: gap,
          scored: false,
          tone: a < 0.62 ? "up" : a < 0.9 ? "gold" : "soft"
        });
        if (Math.random() < c.pickupChance) {
          var kinds = ["strategy", "strategy", "btc", "diamond", "trophy"];
          pickups.push({
            x: W + 24 + 26,
            y: gapY + 0.5 * gap,
            kind: kinds[Math.floor(Math.random() * kinds.length)],
            taken: false,
            bob: Math.random() * Math.PI * 2
          });
        }
      }

      function hitTest() {
        var e = 0.7 * bird.r;
        if (bird.y + e >= groundY || bird.y - e <= 0) return true;
        for (var i = 0; i < pipes.length; i++) {
          var t = pipes[i];
          var l = t.x;
          var r = t.x + 52;
          if (bird.x + e < l || bird.x - e > r) continue;
          var n = t.gapY;
          var b = t.gapY + t.gapH;
          if (bird.y - e < n || bird.y + e > b) return true;
        }
        return false;
      }

      function die() {
        flash = 1;
        var durationMs = Math.max(400, Math.floor(performance.now() - startTs));
        runMeta = {
          pipes: pipeCount,
          pickups: pickupCount,
          durationMs: durationMs
        };
        setPhase("dead");
        if (scoreLive > bestLive) {
          bestLive = scoreLive;
          best = scoreLive;
          setBestDiff(diffRef, scoreLive);
        }
        updateScoreboard();
      }

      function drawBg() {
        var g = ctx.createLinearGradient(0, 0, 0, groundY);
        g.addColorStop(0, "#0b0e11");
        g.addColorStop(0.55, "#12161c");
        g.addColorStop(1, "#0e1218");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, groundY);
        var t = groundY - 18;
        for (var e = 0; e < 28; e++) {
          var l = (38 * e - 0.22 * scrollX) % (W + 80) - 40;
          var a = 18 + (47 * e) % 90;
          ctx.fillStyle =
            e % 3 !== 0
              ? hexAlpha(palette.positive, 0.07 + (e % 4) * 0.015)
              : hexAlpha(palette.btc, 0.06 + (e % 3) * 0.012);
          var n = 0.55 * a;
          var r = t - n - (13 * e) % 40;
          ctx.fillRect(l, r, 7, n);
          ctx.fillRect(l + 3.5 - 0.6, r - 0.2 * a, 1.2, 0.9 * a);
        }
        for (var e2 = 0; e2 < 40; e2++) {
          var t2 = (22 * e2 - 0.35 * scrollX) % (W + 40) - 20;
          var l2 = 6 + (29 * e2) % 28;
          ctx.fillStyle = hexAlpha(
            e2 % 2 === 0 ? palette.positive : palette.btc,
            0.08
          );
          ctx.fillRect(t2, groundY - l2 - 4, 10, l2);
        }
        ctx.strokeStyle = "#1e242c";
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.9;
        for (var y = 48; y < groundY; y += 36) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }
        ctx.globalAlpha = 0.55;
        for (var x = 0; x < W; x += 48) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, groundY);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = hexAlpha("#8b949e", 0.35);
        ctx.font = "500 9px Anonymous Pro, monospace";
        ctx.textAlign = "right";
        var labels = ["1.00", "0.75", "0.50", "0.25"];
        for (var i = 0; i < labels.length; i++) {
          var ty = 56 + ((groundY - 80) / 3) * i;
          ctx.fillText(labels[i], W - 8, ty);
        }
        ctx.textAlign = "left";
        ctx.fillStyle = hexAlpha("#8b949e", 0.28);
        ctx.fillText("1m", 10, groundY - 8);
      }

      function drawTrail() {
        if (trail.length < 2) return;
        ctx.save();
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (var i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i].x, trail[i].y);
        }
        ctx.strokeStyle = hexAlpha(palette.accent, 0.4);
        ctx.lineWidth = 7;
        ctx.stroke();
        var e = ctx.createLinearGradient(
          trail[0].x,
          0,
          trail[trail.length - 1].x,
          0
        );
        e.addColorStop(0, hexAlpha(palette.accent, 0.2));
        e.addColorStop(0.5, palette.accent);
        e.addColorStop(1, hexAlpha(palette.positive, 0.95));
        ctx.strokeStyle = e;
        ctx.lineWidth = 2.4;
        ctx.stroke();
        var t = trail[trail.length - 1];
        var l = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, 14);
        l.addColorStop(0, hexAlpha(palette.accent, 0.55));
        l.addColorStop(1, hexAlpha(palette.accent, 0));
        ctx.fillStyle = l;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 14, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }

      function drawPipe(e) {
        var t =
          e.tone === "up"
            ? palette.positive
            : e.tone === "gold"
              ? palette.btc
              : "#8a6a5a";
        var l = e.x;
        var a = e.gapY;
        var n = e.gapY + e.gapH;
        var r = groundY - n;
        var o = e.tone !== "soft";
        if (a > 6) {
          var n2 = l + 26;
          var r2 = Math.min(a - 8, Math.max(28, 0.72 * a));
          var s = a - r2;
          ctx.strokeStyle = t;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(n2, Math.max(0, s - 18));
          ctx.lineTo(n2, a);
          ctx.stroke();
          roundRect(ctx, l + 4, s, 44, r2, 3);
          ctx.fillStyle = t;
          ctx.fill();
          ctx.strokeStyle = hexAlpha(t, 0.85);
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = hexAlpha("#ffffff", o ? 0.14 : 0.06);
          ctx.fillRect(l + 7, s + 3, 38 * 0.35, r2 - 6);
          ctx.fillStyle = palette.bg;
          ctx.font = "700 9px Anonymous Pro, monospace";
          ctx.textAlign = "center";
          ctx.fillText(
            e.tone === "up" ? "▲" : e.tone === "gold" ? "₿" : "·",
            l + 26,
            Math.max(14, a - 10)
          );
        }
        if (r > 6) {
          var e2 = l + 26;
          var a2 = Math.min(r - 8, Math.max(28, 0.72 * r));
          ctx.strokeStyle = t;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(e2, n);
          ctx.lineTo(e2, Math.min(groundY, n + a2 + 18));
          ctx.stroke();
          roundRect(ctx, l + 4, n, 44, a2, 3);
          ctx.fillStyle = t;
          ctx.fill();
          ctx.strokeStyle = hexAlpha(t, 0.85);
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = hexAlpha("#ffffff", o ? 0.14 : 0.06);
          ctx.fillRect(l + 7, n + 3, 38 * 0.35, a2 - 6);
        }
      }

      function drawPickup(e) {
        if (e.taken) return;
        var t = e.y + 5 * Math.sin(e.bob);
        ctx.save();
        ctx.translate(e.x, t);
        if (e.kind === "btc") {
          ctx.fillStyle = palette.btc;
          ctx.beginPath();
          ctx.arc(0, 0, 11, 0, 2 * Math.PI);
          ctx.fill();
          ctx.fillStyle = palette.bg;
          ctx.font = "700 12px Anonymous Pro, monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("₿", 0, 1);
        } else if (e.kind === "strategy") {
          var grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 19.6);
          grad.addColorStop(0, hexAlpha(palette.accent, 0.35));
          grad.addColorStop(1, hexAlpha(palette.accent, 0));
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, 19.6, 0, 2 * Math.PI);
          ctx.fill();
          if (trophyImg.complete && trophyImg.naturalWidth > 0) {
            ctx.drawImage(trophyImg, -14, -14, 28, 28);
          } else {
            ctx.fillStyle = "#ffffff";
            roundRect(ctx, -10, -11, 20, 20, 4);
            ctx.fill();
            ctx.fillStyle = palette.bg;
            ctx.fillRect(-5, -4, 3, 7);
            ctx.fillRect(2, -4, 3, 7);
          }
        } else if (e.kind === "diamond") {
          ctx.fillStyle = palette.btc;
          ctx.beginPath();
          ctx.moveTo(0, -11);
          ctx.lineTo(10, 0);
          ctx.lineTo(0, 11);
          ctx.lineTo(-10, 0);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = hexAlpha("#ffffff", 0.35);
          ctx.beginPath();
          ctx.moveTo(0, -11);
          ctx.lineTo(5, 0);
          ctx.lineTo(0, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = "#f0c14a";
          ctx.beginPath();
          ctx.moveTo(-7, -8);
          ctx.lineTo(7, -8);
          ctx.lineTo(5, 2);
          ctx.lineTo(-5, 2);
          ctx.closePath();
          ctx.fill();
          ctx.fillRect(-2, 2, 4, 5);
          ctx.fillRect(-6, 7, 12, 3);
          ctx.strokeStyle = hexAlpha("#ffffff", 0.35);
          ctx.lineWidth = 1;
          ctx.strokeRect(-7, -8, 14, 10);
        }
        ctx.restore();
      }

      function frame() {
        if (!alive) return;
        var t = cfg();
        if (phaseRef === "playing") {
          bird.vy += t.gravity;
          bird.y += bird.vy;
          bird.rot = Math.max(-0.55, Math.min(0.9, 0.065 * bird.vy));
          scrollX += t.speed;
          spawnTimer -= 1;
          if (spawnTimer <= 0) {
            spawnPipe();
            spawnTimer = t.spawnEvery;
          }
          for (var i = 0; i < pipes.length; i++) {
            var e = pipes[i];
            e.x -= t.speed;
            if (!e.scored && e.x + 52 < bird.x - 0.3 * bird.r) {
              e.scored = true;
              pipeCount += 1;
              scoreLive += 1;
              score = scoreLive;
              updateScoreboard();
            }
          }
          pipes = pipes.filter(function (e) {
            return e.x + 52 > -40;
          });
          for (var j = 0; j < pickups.length; j++) {
            pickups[j].x -= t.speed;
            pickups[j].bob += 0.08;
          }
          pickups = pickups.filter(function (e) {
            return !e.taken && e.x > -30;
          });
          for (var k = 0; k < trail.length; k++) trail[k].x -= t.speed;
          trail.push({ x: bird.x, y: bird.y });
          while (trail.length > 0 && trail[0].x < -20) trail.shift();
          if (trail.length > 900) trail.splice(0, trail.length - 900);

          var hitR = 0.95 * bird.r;
          for (var p = 0; p < pickups.length; p++) {
            var pk = pickups[p];
            if (pk.taken) continue;
            var bobY = 5 * Math.sin(pk.bob);
            var dx = pk.x - bird.x;
            var dy = pk.y + bobY - bird.y;
            if (dx * dx + dy * dy < (hitR + 12) * (hitR + 12)) {
              pk.taken = true;
              pickupCount += 1;
              scoreLive += 2;
              score = scoreLive;
              updateScoreboard();
              pushToast(
                pk.kind === "btc"
                  ? "+2 ₿"
                  : pk.kind === "strategy"
                    ? "+2 $STRATEGY"
                    : pk.kind === "diamond"
                      ? "+2 diamond"
                      : "+2 trophy"
              );
            }
          }
          if (hitTest()) die();
        } else if (phaseRef === "ready") {
          bird.y = 0.42 * H + 6 * Math.sin(performance.now() / 320);
          bird.rot = 0.08 * Math.sin(performance.now() / 320);
          scrollX += 0.55;
          trail = [{ x: bird.x, y: bird.y }];
        } else {
          bird.rot = Math.min(1.1, bird.rot + 0.04);
          if (bird.y < groundY - bird.r) {
            bird.vy += 1.1 * t.gravity;
            bird.y += bird.vy;
          }
        }

        if (flash > 0) flash = Math.max(0, flash - 0.06);

        drawBg();
        drawTrail();
        for (var pi = 0; pi < pipes.length; pi++) drawPipe(pipes[pi]);
        for (var pu = 0; pu < pickups.length; pu++) drawPickup(pickups[pu]);

        var floorGrad = ctx.createLinearGradient(0, groundY, 0, H);
        floorGrad.addColorStop(0, hexAlpha(palette.accent, 0.12));
        floorGrad.addColorStop(1, palette.soft);
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, groundY, W, H - groundY);
        ctx.strokeStyle = palette.btc;
        ctx.globalAlpha = 0.65;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(W, groundY);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = palette.border;
        ctx.lineWidth = 2;
        var nDash = scrollX % 18;
        for (var dx = -nDash; dx < W; dx += 18) {
          ctx.beginPath();
          ctx.moveTo(dx, groundY + 10);
          ctx.lineTo(dx + 10, groundY + 10);
          ctx.stroke();
        }
        ctx.fillStyle = palette.muted;
        ctx.font = "600 9px Anonymous Pro, monospace";
        ctx.textAlign = "left";
        ctx.fillText("$STRATEGY · $MSTR · $BTC", 10, groundY + 28);

        var o = 2.55 * bird.r;
        ctx.save();
        ctx.translate(bird.x, bird.y);
        ctx.rotate(bird.rot);
        var glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 0.7 * o);
        glow.addColorStop(0, hexAlpha(palette.btc, 0.35));
        glow.addColorStop(1, hexAlpha(palette.btc, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 0.7 * o, 0, 2 * Math.PI);
        ctx.fill();
        if (birdImg.complete && birdImg.naturalWidth > 0) {
          ctx.drawImage(birdImg, -(0.55 * o), -(0.5 * o), 1.15 * o, o);
        } else {
          ctx.fillStyle = palette.btc;
          ctx.beginPath();
          ctx.arc(0, 0, bird.r, 0, 2 * Math.PI);
          ctx.fill();
        }
        ctx.restore();

        ctx.textAlign = "left";
        ctx.fillStyle = palette.text;
        ctx.font = "700 28px Anonymous Pro, ChicagoFLF, monospace";
        ctx.fillText(String(scoreLive), 16, 40);
        ctx.font = "500 11px Anonymous Pro, monospace";
        ctx.fillStyle = palette.muted;
        ctx.fillText(
          "BEST " + bestLive + " · " + DIFFS[diffRef].label.toUpperCase(),
          16,
          58
        );

        if (phaseRef === "ready") {
          drawBanner("Tap anywhere to flap", "Dodge candles · grab trophies");
        } else if (phaseRef === "dead") {
          drawBanner(
            scoreLive > 0 && scoreLive >= bestLive ? "New best!" : "Wick'd",
            "Tap to restart"
          );
        }
        if (flash > 0) {
          ctx.fillStyle = palette.btc;
          ctx.globalAlpha = 0.28 * flash;
          ctx.fillRect(0, 0, W, H);
          ctx.globalAlpha = 1;
        }

        raf = requestAnimationFrame(frame);
      }

      raf = requestAnimationFrame(frame);

      destroyGame = function () {
        alive = false;
        cancelAnimationFrame(raf);
        setBodyLock(false);
        ro.disconnect();
        canvas.removeEventListener("pointerdown", onPointer);
        stage.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("keydown", onKey);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener("resize", resize);
        }
        flapFn = null;
        setDiffFn = null;
      };
    }

    renderTutorial();
    updateScoreboard();
    syncBoardTabs();
    loadLeaderboard(difficulty);
    startCanvas();

    return function unmount() {
      if (destroyGame) destroyGame();
      rootEl.innerHTML = "";
    };
  }

  SA.mountFlappy = mountFlappy;
  SA.buildFlappyShareText = buildShareText;
})(typeof window !== "undefined" ? window : globalThis);
