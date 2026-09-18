/**
 * Strategy Coin CRT swap — noncustodial Relay flow via same-origin APIs.
 * Quotes never include client fee fields; server injects them.
 */
import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
  parseEther,
  formatEther,
  formatUnits
} from "viem";

const STRATEGY = "0x168661c52e5922288dfb2b3f323b6cf90eb21e18";
const NATIVE = "0x0000000000000000000000000000000000000000";
const CHAIN_ID = 4663;

const robinhood = {
  id: CHAIN_ID,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.mainnet.chain.robinhood.com"] }
  }
};

function $(root, sel) {
  return root.querySelector(sel);
}

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: {
      Accept: "application/json",
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(opts.headers || {})
    }
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.ok === false) {
    const err = new Error(json.error || json.detail || "request_failed");
    err.status = res.status;
    err.payload = json;
    throw err;
  }
  return json;
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function shortAddr(a) {
  if (!a) return "";
  return a.slice(0, 6) + "…" + a.slice(-4);
}

function impactPct(details) {
  try {
    const v = details && (details.totalImpact || details.swapImpact || details.impact);
    if (v == null) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return String(v);
    return (n * (Math.abs(n) <= 1 ? 100 : 1)).toFixed(2) + "%";
  } catch (_) {
    return null;
  }
}

function receiveAmount(details) {
  const out = details && details.currencyOut;
  if (!out) return "—";
  if (out.amountFormatted) return out.amountFormatted;
  if (out.amount && out.currency && out.currency.decimals != null) {
    return formatUnits(BigInt(out.amount), out.currency.decimals);
  }
  return "—";
}

function routeLabel(details) {
  const hops = details && (details.route || details.steps || details.path);
  if (typeof hops === "string") return hops;
  return "Relay · Robinhood Chain";
}

export function mountStrategySwap(host, options = {}) {
  if (!host) return { unmount() {} };
  host.innerHTML = "";
  host.classList.add("sc-swap-root");

  const state = {
    config: null,
    account: null,
    walletClient: null,
    publicClient: null,
    amountEth: "",
    quote: null,
    status: "idle",
    error: "",
    requestId: null
  };

  const ui = document.createElement("div");
  ui.className = "sc-swap";
  ui.innerHTML = `
    <div class="sc-swap-row sc-swap-head">
      <div>
        <div class="sc-swap-kicker">SWAP // NONCUSTODIAL</div>
        <div class="sc-swap-title">Buy $STRATEGY</div>
      </div>
      <button type="button" class="sc-swap-wallet" data-act="wallet">CONNECT</button>
    </div>
    <div class="sc-swap-card">
      <div class="sc-swap-label">YOU PAY</div>
      <div class="sc-swap-field">
        <input class="sc-swap-input" data-act="amount" inputmode="decimal" placeholder="0.0" autocomplete="off" />
        <div class="sc-swap-token">ETH</div>
      </div>
      <div class="sc-swap-chain">Robinhood Chain · 4663</div>
    </div>
    <div class="sc-swap-arrow">↓</div>
    <div class="sc-swap-card">
      <div class="sc-swap-label">YOU RECEIVE</div>
      <div class="sc-swap-field">
        <div class="sc-swap-out" data-role="out">—</div>
        <div class="sc-swap-token">STRATEGY</div>
      </div>
    </div>
    <div class="sc-swap-meta">
      <div><span>Route</span><strong data-role="route">—</strong></div>
      <div><span>Impact</span><strong data-role="impact">—</strong></div>
    </div>
    <button type="button" class="sc-swap-go" data-act="swap" disabled>ENTER AMOUNT</button>
    <div class="sc-swap-status" data-role="status"></div>
    <div class="sc-swap-legal">Swaps are noncustodial. Strategy Coin is not affiliated with Robinhood, Strategy Inc., or third-party protocols. Crypto is risky.</div>
  `;
  host.appendChild(ui);

  const elOut = $(ui, "[data-role=out]");
  const elRoute = $(ui, "[data-role=route]");
  const elImpact = $(ui, "[data-role=impact]");
  const elStatus = $(ui, "[data-role=status]");
  const elGo = $(ui, "[data-act=swap]");
  const elWallet = $(ui, "[data-act=wallet]");
  const elAmount = $(ui, "[data-act=amount]");

  function setStatus(text, kind) {
    state.status = kind || state.status;
    elStatus.textContent = text || "";
    elStatus.dataset.kind = kind || "";
  }

  function paintWallet() {
    if (state.account) {
      elWallet.textContent = shortAddr(state.account);
      elWallet.dataset.connected = "1";
    } else {
      elWallet.textContent = "CONNECT";
      elWallet.dataset.connected = "0";
    }
  }

  function paintQuote() {
    const d = state.quote && state.quote.details;
    elOut.textContent = d ? receiveAmount(d) : "—";
    elRoute.textContent = d ? routeLabel(d) : "—";
    elImpact.textContent = d ? impactPct(d) || "—" : "—";
    const ready = !!(state.account && state.quote && state.amountEth);
    elGo.disabled = !ready || state.status === "working";
    if (!state.amountEth) elGo.textContent = "ENTER AMOUNT";
    else if (!state.account) elGo.textContent = "CONNECT WALLET";
    else if (!state.quote) elGo.textContent = "GETTING QUOTE…";
    else elGo.textContent = "SWAP";
  }

  async function ensureConfig() {
    if (state.config) return state.config;
    const cfg = await api("/api/swap/config");
    state.config = cfg;
    const rpc = cfg.rpcUrl || robinhood.rpcUrls.default.http[0];
    robinhood.rpcUrls.default.http = [rpc];
    state.publicClient = createPublicClient({
      chain: robinhood,
      transport: http(rpc)
    });
    return cfg;
  }

  async function connect() {
    setStatus("Connecting…", "working");
    await ensureConfig();
    const eth = typeof window !== "undefined" ? window.ethereum : null;
    if (!eth) {
      setStatus("No wallet found — install a browser wallet.", "error");
      return;
    }
    const accounts = await eth.request({ method: "eth_requestAccounts" });
    const account = accounts && accounts[0];
    if (!account) {
      setStatus("Wallet connection cancelled.", "error");
      return;
    }
    // Switch / add Robinhood Chain
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + CHAIN_ID.toString(16) }]
      });
    } catch (e) {
      if (e && (e.code === 4902 || e.code === -32603)) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x" + CHAIN_ID.toString(16),
              chainName: "Robinhood Chain",
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
              rpcUrls: [state.config.rpcUrl || "https://rpc.mainnet.chain.robinhood.com"],
              blockExplorerUrls: ["https://robinhoodchain.blockscout.com"]
            }
          ]
        });
      } else if (e && e.code !== 4001) {
        throw e;
      }
    }
    state.account = account;
    state.walletClient = createWalletClient({
      account,
      chain: robinhood,
      transport: custom(eth)
    });
    paintWallet();
    setStatus("Wallet connected.", "ok");
    await refreshQuote();
  }

  async function refreshQuote() {
    state.quote = null;
    paintQuote();
    const raw = String(state.amountEth || "").trim();
    if (!raw || !state.account) return;
    let wei;
    try {
      wei = parseEther(raw).toString();
    } catch (_) {
      setStatus("Invalid amount.", "error");
      return;
    }
    setStatus("Fetching quote…", "working");
    try {
      await ensureConfig();
      const res = await api("/api/swap/quote", {
        method: "POST",
        body: JSON.stringify({
          user: state.account,
          originChainId: CHAIN_ID,
          destinationChainId: CHAIN_ID,
          originCurrency: NATIVE,
          destinationCurrency: STRATEGY,
          amount: wei,
          tradeType: "EXACT_INPUT"
        })
      });
      state.quote = res.quote;
      setStatus("Quote ready.", "ok");
      paintQuote();
    } catch (e) {
      state.quote = null;
      setStatus(e.message || "Quote failed.", "error");
      paintQuote();
    }
  }

  const debouncedQuote = debounce(() => {
    refreshQuote();
  }, 450);

  async function pollStatus(requestId) {
    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const res = await api(
          "/api/swap/status?requestId=" + encodeURIComponent(requestId)
        );
        const st = res.status || {};
        const status = String(st.status || st.state || "").toLowerCase();
        if (
          status === "success" ||
          status === "completed" ||
          status === "complete" ||
          status === "filled"
        ) {
          return "success";
        }
        if (status === "failure" || status === "failed" || status === "refunded") {
          return "failed";
        }
        setStatus("Confirming… (" + (status || "pending") + ")", "working");
      } catch (_) {
        // keep polling
      }
    }
    return "timeout";
  }

  async function sendTxItem(item) {
    const data = item && item.data;
    if (!data) return null;
    const hash = await state.walletClient.sendTransaction({
      account: state.account,
      to: data.to,
      data: data.data || "0x",
      value: data.value ? BigInt(data.value) : 0n,
      chain: robinhood,
      gas: data.gas || data.gasLimit ? BigInt(data.gas || data.gasLimit) : undefined
    });
    setStatus("Submitted " + shortAddr(hash), "working");
    if (state.publicClient) {
      await state.publicClient.waitForTransactionReceipt({ hash });
    }
    return hash;
  }

  async function executeSwap() {
    if (!state.account || !state.amountEth) return;
    let wei;
    try {
      wei = parseEther(String(state.amountEth).trim()).toString();
    } catch (_) {
      setStatus("Invalid amount.", "error");
      return;
    }
    state.status = "working";
    elGo.disabled = true;
    setStatus("Preparing…", "working");
    try {
      const exec = await api("/api/swap/execute", {
        method: "POST",
        body: JSON.stringify({
          user: state.account,
          originChainId: CHAIN_ID,
          destinationChainId: CHAIN_ID,
          originCurrency: NATIVE,
          destinationCurrency: STRATEGY,
          amount: wei,
          tradeType: "EXACT_INPUT"
        })
      });
      state.requestId = exec.requestId;
      const steps = exec.steps || [];
      for (const step of steps) {
        const items = step.items || [];
        for (const item of items) {
          if (item.status === "complete" || item.status === "completed") continue;
          setStatus("Confirm in wallet…", "working");
          await sendTxItem(item);
          setStatus("Confirming…", "working");
        }
      }
      if (state.requestId) {
        setStatus("Bridging / settling…", "working");
        const final = await pollStatus(state.requestId);
        if (final === "success") setStatus("Success — $STRATEGY on the way.", "ok");
        else if (final === "failed") setStatus("Swap failed.", "error");
        else setStatus("Submitted — check your wallet / explorer.", "ok");
      } else {
        setStatus("Submitted.", "ok");
      }
    } catch (e) {
      if (e && e.code === 4001) setStatus("Rejected in wallet.", "error");
      else setStatus(e.message || "Swap failed.", "error");
    } finally {
      state.status = "idle";
      paintQuote();
    }
  }

  elAmount.addEventListener("input", () => {
    state.amountEth = elAmount.value;
    state.quote = null;
    paintQuote();
    debouncedQuote();
  });
  elWallet.addEventListener("click", () => {
    connect().catch((e) => setStatus(e.message || "Connect failed.", "error"));
  });
  elGo.addEventListener("click", () => {
    executeSwap();
  });

  ensureConfig().catch(() => {});
  paintWallet();
  paintQuote();
  setStatus("");

  if (typeof options.onReady === "function") options.onReady();

  return {
    unmount() {
      host.innerHTML = "";
    },
    connect,
    refreshQuote
  };
}

// IIFE global for CRT shell
if (typeof window !== "undefined") {
  window.StrategySwap = { mountStrategySwap };
}

export default { mountStrategySwap };
