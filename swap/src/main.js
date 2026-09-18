/**
 * Strategy Coin CRT swap — browser calls StockTokenSwap /api/swap/*.
 * Fee injection stays on STS; this client never sends appFees.
 */
import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
  parseEther,
  formatUnits
} from "viem";

const STS_API = "https://stocktokenswap.com";
const STRATEGY = "0x168661c52e5922288dfb2b3f323b6cf90eb21e18";
const NATIVE = "0x0000000000000000000000000000000000000000";
const CHAIN_ID = 4663;
const WC_PROJECT_ID = "91bdc56e17b546c17c0695c4feea812e";
const RH_RPC = "https://rpc.mainnet.chain.robinhood.com";

const robinhood = {
  id: CHAIN_ID,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RH_RPC] } }
};

function $(root, sel) {
  return root.querySelector(sel);
}

async function sts(path, opts = {}) {
  const res = await fetch(STS_API + path, {
    ...opts,
    headers: {
      Accept: "application/json",
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(opts.headers || {})
    }
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      (json && (json.error || json.message || json.note)) || "request_failed"
    );
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

function fmtAmt(v) {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function sanitizeTxData(data) {
  if (!data || typeof data !== "object") return data;
  const clean = { ...data };
  delete clean.nonce;
  delete clean.gasPrice;
  delete clean.maxFeePerGas;
  delete clean.maxPriorityFeePerGas;
  return clean;
}

export function mountStrategySwap(host) {
  if (!host) return { unmount() {} };
  host.innerHTML = "";
  host.classList.add("sc-swap-root");

  const state = {
    account: null,
    walletClient: null,
    publicClient: createPublicClient({ chain: robinhood, transport: http(RH_RPC) }),
    amountEth: "",
    quote: null,
    envelope: null,
    status: "idle",
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
      <div><span>Network</span><strong data-role="gas">—</strong></div>
      <div><span>Interface</span><strong data-role="iface">—</strong></div>
    </div>
    <button type="button" class="sc-swap-go" data-act="swap" disabled>ENTER AMOUNT</button>
    <div class="sc-swap-status" data-role="status"></div>
    <div class="sc-swap-legal">
      Independent noncustodial interface — not affiliated with Robinhood, Strategy Inc., LONG, or Relay.
      Not a broker, exchange, or advisor. Not investment advice. Robinhood Stock Tokens are restricted in
      US, CA, GB, CH and other issuer jurisdictions; you are responsible for eligibility.
      <a href="https://docs.robinhood.com/rhj/restricted-jurisdictions/" target="_blank" rel="noopener">Restricted jurisdictions</a>
      · <a href="https://stocktokenswap.com/disclaimer" target="_blank" rel="noopener">Disclaimer</a>
    </div>
  `;
  host.appendChild(ui);

  const elOut = $(ui, "[data-role=out]");
  const elRoute = $(ui, "[data-role=route]");
  const elImpact = $(ui, "[data-role=impact]");
  const elGas = $(ui, "[data-role=gas]");
  const elIface = $(ui, "[data-role=iface]");
  const elStatus = $(ui, "[data-role=status]");
  const elGo = $(ui, "[data-act=swap]");
  const elWallet = $(ui, "[data-act=wallet]");
  const elAmount = $(ui, "[data-act=amount]");

  function setStatus(text, kind) {
    elStatus.textContent = text || "";
    elStatus.dataset.kind = kind || "";
  }

  function paintWallet() {
    elWallet.textContent = state.account ? shortAddr(state.account) : "CONNECT";
    elWallet.dataset.connected = state.account ? "1" : "0";
  }

  function paintQuote() {
    const q = state.quote;
    elOut.textContent = q ? fmtAmt(q.receiveAmount) : "—";
    const labels = q && Array.isArray(q.routeLabels) ? q.routeLabels.filter(Boolean) : [];
    elRoute.textContent = labels.length ? labels.join(" · ") : q ? "Relay" : "—";
    const fees = (q && q.fees) || {};
    elImpact.textContent = fees.totalImpactPct != null ? fees.totalImpactPct + "%" : "—";
    elGas.textContent = fees.gasUsd != null ? "$" + fees.gasUsd : "—";
    elIface.textContent =
      fees.interfaceFeeUsd != null ? "$" + fees.interfaceFeeUsd : "—";

    const ready = !!(state.account && state.quote && state.amountEth);
    elGo.disabled = !ready || state.status === "working";
    if (!state.amountEth) elGo.textContent = "ENTER AMOUNT";
    else if (!state.account) elGo.textContent = "CONNECT WALLET";
    else if (!state.quote) elGo.textContent = "GETTING QUOTE…";
    else elGo.textContent = "SWAP";
  }

  function quoteBody(wei) {
    return {
      user: state.account,
      originChainId: CHAIN_ID,
      destinationChainId: CHAIN_ID,
      originCurrency: NATIVE,
      destinationCurrency: STRATEGY,
      amount: wei,
      tradeType: "EXACT_INPUT",
      slippageTolerance: 1
    };
  }

  async function connect() {
    setStatus("Connecting…", "working");
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
              rpcUrls: [RH_RPC],
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
    state.envelope = null;
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
      const res = await sts("/api/swap/quote", {
        method: "POST",
        body: JSON.stringify(quoteBody(wei))
      });
      if (res.swapsEnabled === false) {
        setStatus(res.note || "Swaps temporarily unavailable.", "error");
        return;
      }
      state.envelope = res;
      state.quote = res.quote;
      setStatus(res.note || "Quote ready.", "ok");
      paintQuote();
    } catch (e) {
      state.quote = null;
      setStatus(e.message || "Quote failed.", "error");
      paintQuote();
    }
  }

  const debouncedQuote = debounce(() => refreshQuote(), 450);

  async function pollStatus(requestId) {
    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const st = await sts(
          "/api/swap/intent-status?requestId=" + encodeURIComponent(requestId)
        );
        const status = String(st.status || "").toLowerCase();
        if (
          status === "success" ||
          status === "completed" ||
          status === "complete" ||
          status === "filled" ||
          status === "successfull" ||
          status === "successful"
        ) {
          return "success";
        }
        if (
          status === "failure" ||
          status === "failed" ||
          status === "refunded" ||
          status === "error"
        ) {
          return "failed";
        }
        setStatus("Confirming… (" + (status || "pending") + ")", "working");
      } catch (_) {}
    }
    return "timeout";
  }

  async function sendTxItem(item) {
    const data = sanitizeTxData(item && item.data);
    if (!data || !data.to) return null;
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
    let lastHash = null;
    try {
      const exec = await sts("/api/swap/execute", {
        method: "POST",
        body: JSON.stringify(quoteBody(wei))
      });
      if (!exec.executionAllowed && exec.swapsEnabled === false) {
        setStatus(exec.note || "Swaps disabled.", "error");
        return;
      }
      const quote = exec.quote || exec;
      state.requestId = quote.requestId || exec.requestId;
      const steps = quote.steps || exec.steps || [];
      for (const step of steps) {
        for (const item of step.items || []) {
          if (item.status === "complete" || item.status === "completed") continue;
          setStatus("Confirm in wallet…", "working");
          lastHash = await sendTxItem(item);
          setStatus("Confirming…", "working");
        }
      }
      if (state.requestId && lastHash) {
        try {
          await sts("/api/swap/status", {
            method: "POST",
            body: JSON.stringify({
              requestId: state.requestId,
              wallet: state.account,
              originChainId: CHAIN_ID,
              destinationChainId: CHAIN_ID,
              inputToken: NATIVE,
              outputToken: STRATEGY,
              inputAmount: wei,
              estimatedOutput: state.quote && state.quote.receiveAmount,
              txHash: lastHash,
              status: "submitted"
            })
          });
        } catch (_) {
          // optional reconcile
        }
      }
      if (state.requestId) {
        setStatus("Settling…", "working");
        const final = await pollStatus(state.requestId);
        if (final === "success") setStatus("Success — $STRATEGY received.", "ok");
        else if (final === "failed") setStatus("Swap failed.", "error");
        else setStatus("Submitted — check wallet / explorer.", "ok");
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
  elGo.addEventListener("click", () => executeSwap());

  paintWallet();
  paintQuote();
  setStatus("");
  void WC_PROJECT_ID; // reserved for Reown/WC upgrade; injected wallets work today

  return {
    unmount() {
      host.innerHTML = "";
    }
  };
}

if (typeof window !== "undefined") {
  window.StrategySwap = { mountStrategySwap };
}

export default { mountStrategySwap };
