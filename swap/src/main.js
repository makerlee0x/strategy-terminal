/**
 * Strategy Coin CRT swap — StockTokenSwap /api/swap/* from the browser.
 * Buy/sell, slippage, multi-chain pay tokens, wallet picker. Fees stay on STS.
 */
import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
  parseUnits,
  formatUnits,
  erc20Abi
} from "viem";

const STS_API = "https://stocktokenswap.com";
const STRATEGY = "0x168661c52e5922288dfb2b3f323b6cf90eb21e18";
const NATIVE = "0x0000000000000000000000000000000000000000";
const CHAIN_ID = 4663;
const WC_PROJECT_ID = "91bdc56e17b546c17c0695c4feea812e";
const RH_RPC = "https://rpc.mainnet.chain.robinhood.com";
const SITE_URL =
  typeof window !== "undefined" && window.location && window.location.origin
    ? window.location.origin
    : "https://www.strategycoin.io";

const CHAINS = {
  4663: {
    id: 4663,
    name: "Robinhood",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [RH_RPC] } },
    blockExplorers: {
      default: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com" }
    }
  },
  1: {
    id: 1,
    name: "Ethereum",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: ["https://ethereum.publicnode.com"] } }
  },
  8453: {
    id: 8453,
    name: "Base",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: ["https://base.publicnode.com"] } }
  },
  42161: {
    id: 42161,
    name: "Arbitrum",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: ["https://arbitrum.publicnode.com"] } }
  },
  10: {
    id: 10,
    name: "Optimism",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: ["https://optimism.publicnode.com"] } }
  },
  137: {
    id: 137,
    name: "Polygon",
    nativeCurrency: { name: "Ether", symbol: "POL", decimals: 18 },
    rpcUrls: { default: { http: ["https://polygon.publicnode.com"] } }
  },
  56: {
    id: 56,
    name: "BSC",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrls: { default: { http: ["https://bsc.publicnode.com"] } }
  }
};

const STRATEGY_TOKEN = {
  chainId: CHAIN_ID,
  address: STRATEGY,
  symbol: "STRATEGY",
  name: "Strategy Coin",
  decimals: 18,
  logoURI: null,
  verified: true
};

const DEFAULT_PAY = {
  chainId: CHAIN_ID,
  address: NATIVE,
  symbol: "ETH",
  name: "Ether",
  decimals: 18,
  logoURI: "https://assets.relay.link/icons/1/light.png",
  verified: true
};

function $(root, sel) {
  return root.querySelector(sel);
}

function chainMeta(id) {
  return CHAINS[Number(id)] || {
    id: Number(id),
    name: "Chain " + id,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [RH_RPC] } }
  };
}

function chainHex(id) {
  return "0x" + Number(id).toString(16);
}

function tokenKey(t) {
  if (!t) return "";
  return Number(t.chainId) + ":" + String(t.address || "").toLowerCase();
}

function sameToken(a, b) {
  return tokenKey(a) === tokenKey(b);
}

function isNative(t) {
  return !t || !t.address || String(t.address).toLowerCase() === NATIVE;
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

async function loadWalletConnectProvider() {
  const url = "https://esm.sh/@walletconnect/ethereum-provider@2.21.1";
  const mod = await import(url);
  return mod.default || mod.EthereumProvider;
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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtAmt(v, maxFrac = 6) {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

function fmtUsd(v) {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "$" + String(v);
  return (
    "$" +
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    })
  );
}

function fmtBpsPct(bps) {
  const n = Number(bps);
  if (!Number.isFinite(n)) return "";
  return n / 100 + "%";
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

function discoverEip6963() {
  return new Promise((resolve) => {
    const found = new Map();
    const onAnnounce = (event) => {
      const detail = event && event.detail;
      if (!detail || !detail.info || !detail.provider) return;
      const key = detail.info.rdns || detail.info.uuid || detail.info.name;
      if (key) found.set(key, detail);
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    try {
      window.dispatchEvent(new Event("eip6963:requestProvider"));
    } catch (_) {}
    setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      resolve([...found.values()]);
    }, 120);
  });
}

function legacyInjectedList() {
  const eth = typeof window !== "undefined" ? window.ethereum : null;
  if (!eth) return [];
  const providers = Array.isArray(eth.providers) ? eth.providers : [eth];
  const list = [];
  for (const p of providers) {
    if (!p) continue;
    let name = "Browser wallet";
    let rdns = "browser.injected";
    if (p.isMetaMask && !p.isRabby) {
      name = "MetaMask";
      rdns = "io.metamask";
    } else if (p.isRainbow) {
      name = "Rainbow";
      rdns = "me.rainbow";
    } else if (p.isCoinbaseWallet || p.isCoinbaseBrowser) {
      name = "Coinbase Wallet";
      rdns = "com.coinbase.wallet";
    } else if (p.isRabby) {
      name = "Rabby";
      rdns = "io.rabby";
    } else if (p.isBraveWallet) {
      name = "Brave Wallet";
      rdns = "com.brave.wallet";
    }
    list.push({ info: { name, rdns, icon: null, uuid: rdns }, provider: p });
  }
  return list;
}

async function listWalletOptions() {
  const announced = await discoverEip6963();
  const byRdns = new Map();
  for (const item of announced) byRdns.set(item.info.rdns || item.info.uuid, item);
  for (const item of legacyInjectedList()) {
    if (!byRdns.has(item.info.rdns)) byRdns.set(item.info.rdns, item);
  }
  const preferred = ["io.metamask", "me.rainbow", "com.coinbase.wallet", "io.rabby"];
  return [...byRdns.values()].sort((a, b) => {
    const aw = preferred.indexOf(a.info.rdns);
    const bw = preferred.indexOf(b.info.rdns);
    return (aw === -1 ? 99 : aw) - (bw === -1 ? 99 : bw);
  });
}

async function ensureChain(provider, chainId) {
  const meta = chainMeta(chainId);
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainHex(chainId) }]
    });
  } catch (e) {
    if (e && (e.code === 4902 || e.code === -32603)) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: chainHex(chainId),
            chainName: meta.name + (meta.id === 4663 ? " Chain" : ""),
            nativeCurrency: meta.nativeCurrency,
            rpcUrls: meta.rpcUrls.default.http,
            blockExplorerUrls: meta.blockExplorers
              ? [meta.blockExplorers.default.url]
              : undefined
          }
        ]
      });
    } else if (e && e.code !== 4001) {
      throw e;
    }
  }
}

function publicClientFor(chainId) {
  const meta = chainMeta(chainId);
  return createPublicClient({
    chain: meta,
    transport: http(meta.rpcUrls.default.http[0])
  });
}

export function mountStrategySwap(host) {
  if (!host) return { unmount() {} };
  host.innerHTML = "";
  host.classList.add("sc-swap-root");

  const state = {
    mode: "buy", // buy | sell | bridge
    slippage: 2,
    amountMode: "token", // token | usd
    amount: "",
    payToken: { ...DEFAULT_PAY },
    receiveToken: { ...STRATEGY_TOKEN },
    account: null,
    provider: null,
    walletClient: null,
    quote: null,
    status: "idle",
    requestId: null,
    balance: null,
    balCache: {},
    pickerOpen: false,
    tokenOpen: false,
    tokenQuery: "",
    tokenRows: [],
    wcProvider: null,
    curated: [],
    autoPickedPay: false
  };

  const ui = document.createElement("div");
  ui.className = "sc-swap";
  ui.innerHTML = `
    <div class="sc-swap-row sc-swap-head">
      <div class="sc-swap-modes">
        <button type="button" class="sc-swap-mode" data-mode="buy" data-on="1">Buy</button>
        <button type="button" class="sc-swap-mode" data-mode="sell">Sell</button>
      </div>
      <button type="button" class="sc-swap-wallet" data-act="wallet">CONNECT</button>
    </div>
    <div class="sc-swap-picker" data-role="wallet-picker" hidden></div>

    <div class="sc-swap-toolbar">
      <button type="button" class="sc-swap-link" data-act="bridge">Bridge ETH for gas</button>
      <div class="sc-swap-slip">
        <span>Slip</span>
        <button type="button" class="sc-swap-chip" data-slip="2" data-on="1">2%</button>
        <button type="button" class="sc-swap-chip" data-slip="10">10%</button>
        <button type="button" class="sc-swap-chip" data-slip="15">15%</button>
      </div>
    </div>

    <div class="sc-swap-card">
      <div class="sc-swap-label-row">
        <div class="sc-swap-label">You pay</div>
        <div class="sc-swap-bal" data-role="bal">Bal —</div>
      </div>
      <div class="sc-swap-field">
        <input class="sc-swap-input" data-act="amount" inputmode="decimal" placeholder="0.0" autocomplete="off" />
        <button type="button" class="sc-swap-token-btn" data-act="pick-pay">
          <strong data-role="pay-sym">ETH</strong>
          <span data-role="pay-chain">Robinhood</span>
        </button>
      </div>
      <div class="sc-swap-subrow">
        <div class="sc-swap-usd" data-role="pay-usd">—</div>
        <div class="sc-swap-presets" data-role="presets"></div>
      </div>
    </div>

    <div class="sc-swap-arrow">↓</div>

    <div class="sc-swap-card">
      <div class="sc-swap-label">You receive</div>
      <div class="sc-swap-field">
        <div class="sc-swap-out" data-role="out">—</div>
        <button type="button" class="sc-swap-token-btn" data-act="pick-recv">
          <strong data-role="recv-sym">STRATEGY</strong>
          <span data-role="recv-chain">Robinhood</span>
        </button>
      </div>
      <div class="sc-swap-subrow">
        <div class="sc-swap-usd" data-role="recv-usd">—</div>
        <div class="sc-swap-chain" data-role="route-hint">ETH → STRATEGY</div>
      </div>
    </div>

    <div class="sc-swap-token-modal" data-role="token-modal" hidden></div>

    <div class="sc-swap-meta" data-role="meta" hidden>
      <div><span>Route</span><strong data-role="route">—</strong></div>
      <div><span>Impact</span><strong data-role="impact">—</strong></div>
      <div class="sc-swap-meta-wide"><span>Interface fee</span><strong data-role="iface">—</strong></div>
    </div>

    <button type="button" class="sc-swap-go" data-act="swap" disabled>ENTER AMOUNT</button>
    <div class="sc-swap-status" data-role="status"></div>
    <div class="sc-swap-legal">
      Independent noncustodial interface — not affiliated with Robinhood, Strategy Inc., LONG, or Relay.
      Restricted jurisdictions apply.
      <a href="https://stocktokenswap.com/disclaimer" target="_blank" rel="noopener">Disclaimer</a>
    </div>
  `;
  host.appendChild(ui);

  const el = {
    out: $(ui, "[data-role=out]"),
    route: $(ui, "[data-role=route]"),
    impact: $(ui, "[data-role=impact]"),
    iface: $(ui, "[data-role=iface]"),
    meta: $(ui, "[data-role=meta]"),
    payUsd: $(ui, "[data-role=pay-usd]"),
    recvUsd: $(ui, "[data-role=recv-usd]"),
    bal: $(ui, "[data-role=bal]"),
    status: $(ui, "[data-role=status]"),
    go: $(ui, "[data-act=swap]"),
    wallet: $(ui, "[data-act=wallet]"),
    amount: $(ui, "[data-act=amount]"),
    walletPicker: $(ui, "[data-role=wallet-picker]"),
    tokenModal: $(ui, "[data-role=token-modal]"),
    paySym: $(ui, "[data-role=pay-sym]"),
    payChain: $(ui, "[data-role=pay-chain]"),
    recvSym: $(ui, "[data-role=recv-sym]"),
    recvChain: $(ui, "[data-role=recv-chain]"),
    routeHint: $(ui, "[data-role=route-hint]"),
    presets: $(ui, "[data-role=presets]")
  };

  function setStatus(text, kind) {
    el.status.textContent = text || "";
    el.status.dataset.kind = kind || "";
  }

  function paintWallet() {
    el.wallet.textContent = state.account ? shortAddr(state.account) : "CONNECT";
    el.wallet.dataset.connected = state.account ? "1" : "0";
  }

  function paintMode() {
    ui.querySelectorAll("[data-mode]").forEach((btn) => {
      btn.dataset.on = btn.getAttribute("data-mode") === state.mode ? "1" : "0";
    });
    ui.querySelectorAll("[data-slip]").forEach((btn) => {
      btn.dataset.on = Number(btn.getAttribute("data-slip")) === state.slippage ? "1" : "0";
    });
  }

  function paintTokens() {
    el.paySym.textContent = state.payToken.symbol || "TOKEN";
    el.payChain.textContent = chainMeta(state.payToken.chainId).name;
    el.recvSym.textContent = state.receiveToken.symbol || "TOKEN";
    el.recvChain.textContent = chainMeta(state.receiveToken.chainId).name;
    el.routeHint.textContent =
      (state.payToken.symbol || "?") + " → " + (state.receiveToken.symbol || "?");
    const presets =
      state.payToken.symbol === "ETH"
        ? ["0.1", "0.3", "0.5", "1"]
        : state.payToken.symbol === "USDC" || state.payToken.symbol === "USDG"
          ? ["10", "50", "100", "250"]
          : ["100", "1000", "10000", "100000"];
    el.presets.innerHTML = presets
      .map(
        (p) =>
          `<button type="button" class="sc-swap-chip" data-preset="${p}">${p}</button>`
      )
      .join("");
    el.presets.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.amountMode = "token";
        state.amount = btn.getAttribute("data-preset");
        el.amount.value = state.amount;
        paintMode();
        paintQuote();
        debouncedQuote();
      });
    });
  }

  function paintBalance() {
    if (state.balance == null) {
      el.bal.innerHTML = "Bal —";
      return;
    }
    el.bal.innerHTML =
      "Bal " +
      fmtAmt(state.balance, 6) +
      " " +
      (state.payToken.symbol || "") +
      ' · <button type="button" class="sc-swap-max" data-act="max">Max</button>';
    const maxBtn = el.bal.querySelector("[data-act=max]");
    if (maxBtn) {
      maxBtn.addEventListener("click", () => {
        if (state.balance == null) return;
        state.amountMode = "token";
        // leave a tiny gas buffer for native
        let v = Number(state.balance);
        if (isNative(state.payToken) && v > 0.0002) v = Math.max(0, v - 0.00015);
        state.amount = String(v);
        el.amount.value = state.amount;
        paintMode();
        paintQuote();
        debouncedQuote();
      });
    }
  }

  function paintQuote() {
    const q = state.quote;
    el.out.textContent = q ? fmtAmt(q.receiveAmount) : "—";
    el.payUsd.textContent = q ? "~" + fmtUsd(q.payAmountUsd) : "—";
    el.recvUsd.textContent = q ? "~" + fmtUsd(q.receiveAmountUsd) : "—";
    const labels = q && Array.isArray(q.routeLabels) ? q.routeLabels.filter(Boolean) : [];
    el.route.textContent = labels.length ? labels.join(" · ") : q ? "Relay" : "—";
    const fees = (q && q.fees) || {};
    el.impact.textContent =
      fees.totalImpactPct != null
        ? fees.totalImpactPct + "%"
        : fees.swapImpactPct != null
          ? fees.swapImpactPct + "%"
          : "—";
    if (fees.interfaceFeeUsd != null) {
      const bps =
        fees.interfaceFeeBps != null ? " · " + fmtBpsPct(fees.interfaceFeeBps) : "";
      el.iface.textContent = fmtUsd(fees.interfaceFeeUsd) + bps;
    } else el.iface.textContent = "—";
    el.meta.hidden = !q;

    const ready = !!(state.account && state.quote && state.amount);
    el.go.disabled = !ready || state.status === "working";
    if (!state.amount) el.go.textContent = "ENTER AMOUNT";
    else if (!state.account) el.go.textContent = "CONNECT WALLET";
    else if (!state.quote) el.go.textContent = "GETTING QUOTE…";
    else if (state.mode === "bridge") el.go.textContent = "BRIDGE ETH";
    else if (state.mode === "sell") el.go.textContent = "SELL";
    else el.go.textContent = "SWAP";
  }

  async function readTokenBalance(token, account) {
    if (!token || !account) return null;
    const key = tokenKey(token);
    const hit = state.balCache[key];
    if (hit && Date.now() - hit.at < 45000) return hit.v;
    try {
      const client = publicClientFor(token.chainId);
      let v = 0;
      if (isNative(token)) {
        const wei = await client.getBalance({ address: account });
        v = Number(formatUnits(wei, token.decimals || 18));
      } else {
        const raw = await client.readContract({
          address: token.address,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [account]
        });
        v = Number(formatUnits(raw, token.decimals || 18));
      }
      if (!Number.isFinite(v)) v = 0;
      state.balCache[key] = { v, at: Date.now() };
      return v;
    } catch (_) {
      return null;
    }
  }

  async function refreshBalance() {
    state.balance = null;
    paintBalance();
    if (!state.account || !state.payToken) return;
    const v = await readTokenBalance(state.payToken, state.account);
    state.balance = v;
    paintBalance();
  }

  async function enrichWithBalances(tokens) {
    if (!state.account || !tokens.length) {
      return tokens.map((t) => ({ ...t, bal: null }));
    }
    // Parallel but chunked so we don't hammer RPCs
    const out = new Array(tokens.length);
    const chunk = 8;
    for (let i = 0; i < tokens.length; i += chunk) {
      const slice = tokens.slice(i, i + chunk);
      const part = await Promise.all(
        slice.map(async (t) => {
          const bal = await readTokenBalance(t, state.account);
          return { ...t, bal };
        })
      );
      for (let j = 0; j < part.length; j++) out[i + j] = part[j];
    }
    return out;
  }

  function splitByBalance(tokens) {
    const withBal = [];
    const rest = [];
    for (const t of tokens) {
      if (t.bal != null && Number(t.bal) > 0) withBal.push(t);
      else rest.push(t);
    }
    withBal.sort((a, b) => Number(b.bal) - Number(a.bal));
    return { withBal, rest };
  }

  async function preferBalancedPayToken() {
    if (!state.account || state.mode !== "buy") {
      await refreshBalance();
      return;
    }
    try {
      // Wider scan: curated RH + a few search hits for common pay assets
      const [base, eth, usdc] = await Promise.all([
        loadTokenRows(""),
        loadTokenRows("ETH"),
        loadTokenRows("USDC")
      ]);
      const seen = new Set();
      const merged = [];
      for (const t of [].concat(base || [], eth || [], usdc || [])) {
        const k = tokenKey(t);
        if (!k || seen.has(k)) continue;
        // Skip STRATEGY as a pay default on buy
        if (sameToken(t, STRATEGY_TOKEN)) continue;
        seen.add(k);
        merged.push(t);
      }
      const enriched = await enrichWithBalances(merged.slice(0, 36));
      const { withBal } = splitByBalance(enriched);
      const curBal = await readTokenBalance(state.payToken, state.account);
      if (curBal != null && curBal > 0) {
        state.balance = curBal;
        paintBalance();
        return;
      }
      if (withBal.length) {
        // Prefer Robinhood native/ETH if it has balance, else highest balance
        const rh = withBal.find((t) => Number(t.chainId) === CHAIN_ID);
        const pick = rh || withBal[0];
        state.payToken = {
          chainId: Number(pick.chainId),
          address: pick.address,
          symbol: pick.symbol,
          name: pick.name,
          decimals: pick.decimals || 18,
          logoURI: pick.logoURI || null,
          verified: !!pick.verified
        };
        state.autoPickedPay = true;
        state.receiveToken = { ...STRATEGY_TOKEN };
        paintTokens();
        state.balance = pick.bal;
        paintBalance();
        return;
      }
    } catch (_) {}
    await refreshBalance();
  }

  function applyModeDefaults(mode) {
    state.mode = mode;
    if (mode === "buy") {
      if (sameToken(state.payToken, STRATEGY_TOKEN)) state.payToken = { ...DEFAULT_PAY };
      state.receiveToken = { ...STRATEGY_TOKEN };
    } else if (mode === "sell") {
      state.payToken = { ...STRATEGY_TOKEN };
      if (sameToken(state.receiveToken, STRATEGY_TOKEN))
        state.receiveToken = { ...DEFAULT_PAY };
    } else if (mode === "bridge") {
      state.payToken = {
        chainId: 1,
        address: NATIVE,
        symbol: "ETH",
        name: "Ether",
        decimals: 18,
        verified: true
      };
      state.receiveToken = { ...DEFAULT_PAY };
    }
    state.quote = null;
    paintMode();
    paintTokens();
    paintQuote();
    if (state.account && mode === "buy") preferBalancedPayToken();
    else refreshBalance();
    debouncedQuote();
  }

  function amountBaseUnits() {
    const raw = String(state.amount || "").trim();
    if (!raw) return null;
    let tokenAmt = raw;
    if (state.amountMode === "usd") {
      const q = state.quote;
      const usd = Number(raw);
      if (!Number.isFinite(usd) || usd <= 0) return null;
      // Prefer last quote price; else rough from payAmountUsd if present on a 1-unit basis
      let px = null;
      if (q && q.payAmountUsd && q.payAmount) {
        const pa = Number(q.payAmount);
        const pu = Number(q.payAmountUsd);
        if (pa > 0 && pu > 0) px = pu / pa;
      }
      if (!px || !Number.isFinite(px) || px <= 0) {
        // fall back: treat as token for first quote
        tokenAmt = raw;
      } else {
        tokenAmt = String(usd / px);
      }
    }
    try {
      return parseUnits(tokenAmt, state.payToken.decimals || 18).toString();
    } catch (_) {
      return null;
    }
  }

  function quoteBody(wei) {
    return {
      user: state.account,
      originChainId: Number(state.payToken.chainId),
      destinationChainId: Number(state.receiveToken.chainId),
      originCurrency: state.payToken.address,
      destinationCurrency: state.receiveToken.address,
      amount: wei,
      tradeType: "EXACT_INPUT",
      slippageTolerance: state.slippage
    };
  }

  async function refreshQuote() {
    state.quote = null;
    paintQuote();
    if (!state.account || !String(state.amount || "").trim()) return;
    const wei = amountBaseUnits();
    if (!wei || wei === "0") {
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

  function closeWalletPicker() {
    state.pickerOpen = false;
    el.walletPicker.hidden = true;
    el.walletPicker.innerHTML = "";
  }

  function closeTokenModal() {
    state.tokenOpen = false;
    el.tokenModal.hidden = true;
    el.tokenModal.innerHTML = "";
  }

  async function bindProvider(provider, label) {
    setStatus("Connecting" + (label ? " " + label : "") + "…", "working");
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    const account = accounts && accounts[0];
    if (!account) {
      setStatus("Wallet connection cancelled.", "error");
      return;
    }
    await ensureChain(provider, state.payToken.chainId || CHAIN_ID);
    state.provider = provider;
    state.account = account;
    state.walletClient = createWalletClient({
      account,
      chain: chainMeta(state.payToken.chainId || CHAIN_ID),
      transport: custom(provider)
    });
    if (provider.on) {
      provider.on("accountsChanged", (accs) => {
        state.account = (accs && accs[0]) || null;
        state.balCache = {};
        state.autoPickedPay = false;
        paintWallet();
        if (state.account) {
          preferBalancedPayToken().then(() => refreshQuote());
        } else {
          state.balance = null;
          paintBalance();
          state.quote = null;
          paintQuote();
        }
      });
    }
    closeWalletPicker();
    paintWallet();
    setStatus((label || "Wallet") + " connected.", "ok");
    state.balCache = {};
    state.autoPickedPay = false;
    await preferBalancedPayToken();
    await refreshQuote();
  }

  async function connectWalletConnect() {
    setStatus("Opening WalletConnect…", "working");
    if (!state.wcProvider) {
      const EthereumProvider = await loadWalletConnectProvider();
      if (!EthereumProvider || typeof EthereumProvider.init !== "function") {
        throw new Error("WalletConnect failed to load.");
      }
      state.wcProvider = await EthereumProvider.init({
        projectId: WC_PROJECT_ID,
        chains: [CHAIN_ID],
        optionalChains: [1, 8453, 42161, 10, 137, 56],
        showQrModal: true,
        methods: [
          "eth_sendTransaction",
          "eth_signTransaction",
          "personal_sign",
          "eth_signTypedData_v4"
        ],
        metadata: {
          name: "Strategy Coin",
          description: "Buy $STRATEGY on Robinhood Chain",
          url: SITE_URL,
          icons: [SITE_URL + "/assets/favicon.png"]
        }
      });
    }
    await state.wcProvider.connect();
    await bindProvider(state.wcProvider, "WalletConnect");
  }

  async function openWalletPicker() {
    if (state.account) {
      state.account = null;
      state.walletClient = null;
      state.provider = null;
      state.quote = null;
      paintWallet();
      paintQuote();
      paintBalance();
    }
    state.pickerOpen = true;
    el.walletPicker.hidden = false;
    el.walletPicker.innerHTML =
      '<div class="sc-swap-picker-loading">Detecting wallets…</div>';
    const wallets = await listWalletOptions();
    const hasMetaMask = wallets.some(
      (w) => w.info.rdns === "io.metamask" || /metamask/i.test(w.info.name || "")
    );
    const rows = [];
    if (!hasMetaMask) {
      rows.push(
        `<a class="sc-swap-picker-item sc-swap-picker-link" href="https://metamask.io/download/" target="_blank" rel="noopener">MetaMask <span>Install</span></a>`
      );
    }
    for (const w of wallets) {
      rows.push(
        `<button type="button" class="sc-swap-picker-item" data-rdns="${encodeURIComponent(
          w.info.rdns || ""
        )}">${escapeHtml(w.info.name || "Wallet")}</button>`
      );
    }
    rows.push(
      `<button type="button" class="sc-swap-picker-item" data-act="wc">WalletConnect <span>QR / mobile</span></button>`
    );
    el.walletPicker.innerHTML =
      '<div class="sc-swap-picker-title">Choose wallet</div>' + rows.join("");
    el.walletPicker.querySelectorAll("[data-rdns]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const rdns = decodeURIComponent(btn.getAttribute("data-rdns") || "");
        const match = wallets.find((w) => (w.info.rdns || "") === rdns);
        if (!match) return;
        bindProvider(match.provider, match.info.name).catch((e) =>
          setStatus(e.message || "Connect failed.", "error")
        );
      });
    });
    const wcBtn = el.walletPicker.querySelector("[data-act=wc]");
    if (wcBtn) {
      wcBtn.addEventListener("click", () => {
        connectWalletConnect().catch((e) =>
          setStatus(e.message || "WalletConnect failed.", "error")
        );
      });
    }
  }

  async function loadTokenRows(query) {
    const q = String(query || "").trim();
    try {
      const res = await sts(
        "/api/swap/tokens?term=" +
          encodeURIComponent(q) +
          "&limit=24" +
          (q ? "" : "&chainId=" + CHAIN_ID)
      );
      const tokens = Array.isArray(res.tokens) ? res.tokens : [];
      if (!q && tokens.length) state.curated = tokens;
      return tokens.length ? tokens : state.curated;
    } catch (_) {
      return state.curated;
    }
  }

  async function openTokenPicker(side) {
    state.tokenOpen = side;
    el.tokenModal.hidden = false;
    el.tokenModal.innerHTML = `
      <div class="sc-swap-token-sheet">
        <div class="sc-swap-token-head">
          <strong>${side === "pay" ? "Pay with" : "Receive"}</strong>
          <button type="button" data-act="close-token">Close</button>
        </div>
        <input class="sc-swap-token-search" data-act="token-search" placeholder="Search any token (ETH, USDC…)" />
        <div class="sc-swap-token-help">Cross-chain tokens via Relay. STRATEGY stays the featured Buy destination.</div>
        <div class="sc-swap-token-list" data-role="token-list">Loading…</div>
      </div>`;
    $(el.tokenModal, "[data-act=close-token]").addEventListener("click", closeTokenModal);
    const search = $(el.tokenModal, "[data-act=token-search]");
    const list = $(el.tokenModal, "[data-role=token-list]");

    function rowHtml(t) {
      const chain = chainMeta(t.chainId).name;
      const balTxt =
        t.bal != null && Number(t.bal) > 0
          ? fmtAmt(t.bal, 5)
          : t.selected
            ? "SELECTED"
            : "";
      return `<button type="button" class="sc-swap-token-row${
        t.selected ? " is-selected" : ""
      }${t.bal != null && Number(t.bal) > 0 ? " has-bal" : ""}" data-key="${escapeHtml(
        tokenKey(t)
      )}">
              <span class="sc-swap-token-main">
                <strong>${escapeHtml(t.symbol || "?")} <em>${escapeHtml(chain)}</em></strong>
                <span>${escapeHtml(t.name || "")}</span>
              </span>
              <span class="sc-swap-token-side">${escapeHtml(balTxt)}</span>
            </button>`;
    }

    async function renderList(term) {
      list.textContent = "Loading…";
      const tokens = await loadTokenRows(term);
      if (!tokens.length) {
        state.tokenRows = [];
        list.innerHTML = '<div class="sc-swap-picker-loading">No tokens found.</div>';
        return;
      }
      list.innerHTML =
        (state.account
          ? '<div class="sc-swap-picker-loading">Checking balances…</div>'
          : "") + '<div class="sc-swap-token-sec">ALL TOKENS</div>';
      const enriched = await enrichWithBalances(tokens);
      state.tokenRows = enriched;
      for (const t of enriched) {
        t.selected =
          (side === "pay" && sameToken(t, state.payToken)) ||
          (side === "recv" && sameToken(t, state.receiveToken));
      }
      const { withBal, rest } = splitByBalance(enriched);
      let html = "";
      if (withBal.length) {
        html +=
          '<div class="sc-swap-token-sec">YOUR TOKENS</div>' +
          withBal.map(rowHtml).join("");
        html += '<div class="sc-swap-token-sec">ALL TOKENS</div>' + rest.map(rowHtml).join("");
      } else {
        html +=
          (state.account
            ? '<div class="sc-swap-token-help">No balances detected in this list — pick any token below.</div>'
            : "") +
          '<div class="sc-swap-token-sec">ALL TOKENS</div>' +
          enriched.map(rowHtml).join("");
      }
      list.innerHTML = html;
      list.querySelectorAll("[data-key]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const key = btn.getAttribute("data-key");
          const t = state.tokenRows.find((x) => tokenKey(x) === key);
          if (!t) return;
          if (side === "pay") {
            if (state.mode === "sell") {
              state.receiveToken = t;
            } else {
              state.payToken = t;
              if (state.mode === "buy") state.receiveToken = { ...STRATEGY_TOKEN };
            }
          } else {
            state.receiveToken = t;
          }
          closeTokenModal();
          paintTokens();
          paintQuote();
          refreshBalance();
          debouncedQuote();
        });
      });
    }

    search.addEventListener(
      "input",
      debounce(() => renderList(search.value), 280)
    );
    await renderList("");
  }

  async function pollStatus(requestId) {
    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const st = await sts(
          "/api/swap/intent-status?requestId=" + encodeURIComponent(requestId)
        );
        const status = String(st.status || "").toLowerCase();
        if (
          ["success", "completed", "complete", "filled", "successful", "successfull"].includes(
            status
          )
        )
          return "success";
        if (["failure", "failed", "refunded", "error"].includes(status)) return "failed";
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
      chain: chainMeta(state.payToken.chainId),
      gas: data.gas || data.gasLimit ? BigInt(data.gas || data.gasLimit) : undefined
    });
    setStatus("Submitted " + shortAddr(hash), "working");
    const pub = publicClientFor(state.payToken.chainId);
    await pub.waitForTransactionReceipt({ hash });
    return hash;
  }

  async function executeSwap() {
    if (!state.account || !state.amount) return;
    const wei = amountBaseUnits();
    if (!wei) {
      setStatus("Invalid amount.", "error");
      return;
    }
    state.status = "working";
    el.go.disabled = true;
    setStatus("Preparing…", "working");
    let lastHash = null;
    try {
      await ensureChain(state.provider, state.payToken.chainId);
      state.walletClient = createWalletClient({
        account: state.account,
        chain: chainMeta(state.payToken.chainId),
        transport: custom(state.provider)
      });
      const exec = await sts("/api/swap/execute", {
        method: "POST",
        body: JSON.stringify(quoteBody(wei))
      });
      if (!exec.executionAllowed && exec.swapsEnabled === false) {
        setStatus(exec.note || "Swaps disabled.", "error");
        return;
      }
      const quote = exec.quote || exec;
      if (quote && quote.fees) {
        state.quote = quote;
        paintQuote();
      }
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
              originChainId: Number(state.payToken.chainId),
              destinationChainId: Number(state.receiveToken.chainId),
              inputToken: state.payToken.address,
              outputToken: state.receiveToken.address,
              inputAmount: wei,
              estimatedOutput: state.quote && state.quote.receiveAmount,
              txHash: lastHash,
              status: "submitted"
            })
          });
        } catch (_) {}
      }
      if (state.requestId) {
        setStatus("Settling…", "working");
        const final = await pollStatus(state.requestId);
        if (final === "success") setStatus("Success.", "ok");
        else if (final === "failed") setStatus("Swap failed.", "error");
        else setStatus("Submitted — check wallet / explorer.", "ok");
      } else setStatus("Submitted.", "ok");
      refreshBalance();
    } catch (e) {
      if (e && e.code === 4001) setStatus("Rejected in wallet.", "error");
      else setStatus(e.message || "Swap failed.", "error");
    } finally {
      state.status = "idle";
      paintQuote();
    }
  }

  // events
  ui.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => applyModeDefaults(btn.getAttribute("data-mode")));
  });
  ui.querySelectorAll("[data-slip]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.slippage = Number(btn.getAttribute("data-slip")) || 2;
      paintMode();
      debouncedQuote();
    });
  });
  $(ui, "[data-act=bridge]").addEventListener("click", () => applyModeDefaults("bridge"));
  $(ui, "[data-act=pick-pay]").addEventListener("click", () => {
    openTokenPicker(state.mode === "sell" ? "recv" : "pay").catch((e) =>
      setStatus(e.message || "Token list failed.", "error")
    );
  });
  $(ui, "[data-act=pick-recv]").addEventListener("click", () => {
    openTokenPicker(state.mode === "buy" ? "recv" : "recv").catch((e) =>
      setStatus(e.message || "Token list failed.", "error")
    );
  });
  el.amount.addEventListener("input", () => {
    state.amount = el.amount.value;
    state.quote = null;
    paintQuote();
    debouncedQuote();
  });
  el.wallet.addEventListener("click", () => {
    if (state.pickerOpen) {
      closeWalletPicker();
      return;
    }
    openWalletPicker().catch((e) => setStatus(e.message || "Connect failed.", "error"));
  });
  el.go.addEventListener("click", () => executeSwap());

  paintWallet();
  paintMode();
  paintTokens();
  paintQuote();
  paintBalance();
  setStatus("");
  loadTokenRows("").catch(() => {});

  return {
    unmount() {
      closeWalletPicker();
      closeTokenModal();
      host.innerHTML = "";
    }
  };
}

if (typeof window !== "undefined") {
  window.StrategySwap = { mountStrategySwap };
}

export default { mountStrategySwap };
