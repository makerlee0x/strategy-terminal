// Swap engine for Robinhood Chain via StockTokenSwap (quote, execute, status).
// Shared by the swap window and the terminal BUY/SELL flow.
export const RPC = process.env.NEXT_PUBLIC_ROBINHOOD_CHAIN_RPC_URL || 'https://rpc.mainnet.chain.robinhood.com';
// Public WalletConnect project id (allowlist strategycoin.io on Reown). Override with env if needed.
export const WC_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '91bdc56e17b546c17c0695c4feea812e';
export const DEFAULT_FEE_BPS = 25;
export const API = 'https://stocktokenswap.com';
export const CHAIN = 4663;
export const ZERO = '0x0000000000000000000000000000000000000000';
export const ETH = { chainId: CHAIN, address: ZERO, symbol: 'ETH', decimals: 18, label: 'ETH' };
export const MSTR = {
  chainId: CHAIN,
  address: '0xec262a75e413fafd0df80480274532c79d42da09',
  symbol: 'MSTR',
  decimals: 18,
  label: 'MSTR'
};
export const STRAT = {
  chainId: CHAIN,
  address: '0x168661c52e5922288dfb2b3f323b6cf90eb21e18',
  symbol: '$STRATEGY',
  decimals: 18,
  label: '$STRATEGY'
};
export const USDG = {
  chainId: CHAIN,
  address: '0x5fc5360d0400a0fd4f2af552add042d716f1d168',
  symbol: 'USDG',
  decimals: 6,
  label: 'USDG'
};
export const ETH_L1 = { chainId: 1, address: ZERO, symbol: 'ETH', decimals: 18, label: 'ETH · Ethereum' };
export const ETH_BASE = { chainId: 8453, address: ZERO, symbol: 'ETH', decimals: 18, label: 'ETH · Base' };
export const ETH_ARB = { chainId: 42161, address: ZERO, symbol: 'ETH', decimals: 18, label: 'ETH · Arbitrum' };
export const ETH_OP = { chainId: 10, address: ZERO, symbol: 'ETH', decimals: 18, label: 'ETH · Optimism' };
export const USDC_L1 = {
  chainId: 1,
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  symbol: 'USDC',
  decimals: 6,
  label: 'USDC · Ethereum'
};
export const USDC_BASE = {
  chainId: 8453,
  address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  symbol: 'USDC',
  decimals: 6,
  label: 'USDC · Base'
};
export const USDC_ARB = {
  chainId: 42161,
  address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
  symbol: 'USDC',
  decimals: 6,
  label: 'USDC · Arbitrum'
};

/** Pay tokens for buying $STRATEGY (RH + cross-chain via Relay). */
export const BUY_PAY_TOKENS = [
  ETH,
  USDG,
  MSTR,
  ETH_L1,
  USDC_L1,
  ETH_BASE,
  USDC_BASE,
  ETH_ARB,
  USDC_ARB,
  ETH_OP
];
export const SELL_RECV_TOKENS = [ETH, MSTR];
export const CHAIN_NAME = {
  1: 'Ethereum',
  [CHAIN]: 'Robinhood Chain',
  8453: 'Base',
  42161: 'Arbitrum',
  10: 'Optimism'
};
export const tokenKey = (t) =>
  (t.symbol || '') + '-' + t.chainId + '-' + String(t.address || '').toLowerCase();
export const tokLabel = (t) => t.label || t.symbol;
export const isStable = (t) => t.decimals === 6 || /USD/i.test(t.symbol || '');

export const RH = {
  chainId: '0x1237',
  chainName: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: [RPC],
  blockExplorerUrls: ['https://robinhoodchain.blockscout.com']
};

export const toUnits = (v, d) => {
  const [i, f = ''] = String(v).trim().split('.');
  if (!/^\d*$/.test(i) || !/^\d*$/.test(f)) return null;
  return (
    BigInt(i || '0') * 10n ** BigInt(d) + BigInt((f + '0'.repeat(d)).slice(0, d) || '0')
  ).toString();
};
export const fmtN = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: n < 1 ? 8 : 4 }) : '—';
};
export const usd = (v) =>
  v == null ? '—' : '$' + Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 });

export async function call(path, opt = {}) {
  const r = await fetch(API + path, {
    ...opt,
    headers: {
      Accept: 'application/json',
      ...(opt.body ? { 'Content-Type': 'application/json' } : {})
    }
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(j.error || j.message || j.note || 'request_failed');
    e.status = r.status;
    e.payload = j;
    throw e;
  }
  return j;
}

export async function rpcCall(method, params, url = RPC) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  }).then((res) => res.json());
  if (r.error) throw new Error(r.error.message);
  return r.result;
}

export const L1_RPC = 'https://ethereum.publicnode.com';
export const BASE_RPC = 'https://mainnet.base.org';
export const ARB_RPC = 'https://arb1.arbitrum.io/rpc';
export const OP_RPC = 'https://mainnet.optimism.io';
export const RPC_BY_CHAIN = {
  1: L1_RPC,
  [CHAIN]: RPC,
  8453: BASE_RPC,
  42161: ARB_RPC,
  10: OP_RPC
};

export async function balanceOf(tok, acct) {
  const url = RPC_BY_CHAIN[tok.chainId] || RPC;
  const raw =
    tok.address === ZERO
      ? await rpcCall('eth_getBalance', [acct, 'latest'], url)
      : await rpcCall(
          'eth_call',
          [
            {
              to: tok.address,
              data: '0x70a08231' + acct.slice(2).toLowerCase().padStart(64, '0')
            },
            'latest'
          ],
          url
        );
  return BigInt(raw || '0x0');
}

export const fromUnits = (b, d) => {
  const s = b.toString().padStart(d + 1, '0');
  return (s.slice(0, -d) + '.' + s.slice(-d)).replace(/\.?0+$/, '');
};
export const MSTR_TOK = MSTR;

export async function useProvider(p) {
  const [a] = await p.request({ method: 'eth_requestAccounts' });
  return a;
}

export async function connectInjected() {
  const p = typeof window !== 'undefined' && window.ethereum;
  if (!p) throw new Error('No browser wallet found. Try WalletConnect.');
  return { prov: p, acct: await useProvider(p) };
}

export async function connectWC() {
  if (!WC_ID) throw new Error('WalletConnect is not configured (NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID).');
  const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
  const p = await EthereumProvider.init({
    projectId: WC_ID,
    chains: [CHAIN],
    optionalChains: [1, 8453, 42161, 10],
    showQrModal: true,
    rpcMap: {
      [CHAIN]: RPC,
      1: L1_RPC,
      8453: BASE_RPC,
      42161: ARB_RPC,
      10: OP_RPC
    },
    metadata: {
      name: 'STRATEGY COIN',
      description: 'Buy $STRATEGY on Robinhood Chain',
      url: typeof location !== 'undefined' ? location.origin : 'https://strategycoin.io',
      icons: [
        (typeof location !== 'undefined' ? location.origin : 'https://strategycoin.io') +
          '/strategy-icon.png'
      ]
    }
  });
  await p.connect();
  return { prov: p, acct: await useProvider(p) };
}

export async function ensureChain(prov, id) {
  const hex = '0x' + id.toString(16);
  try {
    await prov.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hex }] });
  } catch (e) {
    if (e.code === 4902 && id === CHAIN) {
      await prov.request({ method: 'wallet_addEthereumChain', params: [RH] });
    } else throw e;
  }
}

export const swapBody = ({ acct, payTok, recvTok, w, slip }) => ({
  user: acct,
  originChainId: payTok.chainId,
  destinationChainId: recvTok.chainId,
  originCurrency: payTok.address,
  destinationCurrency: recvTok.address,
  amount: w,
  tradeType: 'EXACT_INPUT',
  slippageTolerance: slip
});

export function feeLine(quote) {
  const bps = quote?.fees?.interfaceFeeBps != null ? Number(quote.fees.interfaceFeeBps) : DEFAULT_FEE_BPS;
  const pct = (bps / 100) + '%';
  if (quote?.fees?.interfaceFeeUsd != null) return usd(quote.fees.interfaceFeeUsd) + ' · ' + pct;
  if (quote?.payAmountUsd != null) return pct + ' · ~' + usd(quote.payAmountUsd * bps / 1e4);
  return pct;
}

export async function getQuote(args) {
  const y = await call('/api/swap/quote', {
    method: 'POST',
    body: JSON.stringify(swapBody(args))
  });
  if (y.swapsEnabled === false) throw new Error(y.note || 'Swaps temporarily unavailable.');
  return { quote: y.quote, note: y.note };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function stepData(it) {
  let d = it?.data;
  if (typeof d === 'string') {
    try {
      d = JSON.parse(d);
    } catch (_) {
      return null;
    }
  }
  return d && typeof d === 'object' ? d : null;
}

function toHexQuantity(v) {
  if (v == null || v === '' || v === '0x' || v === '0X') return null;
  try {
    const n = typeof v === 'bigint' ? v : BigInt(v);
    if (n < 0n) return null;
    return '0x' + n.toString(16);
  } catch (_) {
    return null;
  }
}

async function waitReceipt(prov, hash, { timeoutMs = 180000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await prov.request({ method: 'eth_getTransactionReceipt', params: [hash] });
      if (r) return r;
    } catch (_) {}
    await sleep(1500);
  }
  return null;
}

async function signStepItem(prov, acct, it, onStatus) {
  const d = stepData(it);
  if (!d) throw new Error('Missing signature data from route.');
  const kind = String(d.signatureKind || '').toLowerCase();
  onStatus('Sign in wallet…', 'working', { phase: 'sign' });
  let sig;
  if (kind === 'eip712') {
    sig = await prov.request({
      method: 'eth_signTypedData_v4',
      params: [
        acct,
        JSON.stringify({
          types: d.types,
          domain: d.domain,
          primaryType: d.primaryType,
          message: d.value || d.message
        })
      ]
    });
  } else {
    // eip191 / default personal_sign
    sig = await prov.request({
      method: 'personal_sign',
      params: [d.message || d.value || '', acct]
    });
  }
  const post = it.post;
  if (post?.endpoint) {
    const ep = String(post.endpoint);
    const path = ep.startsWith('http') ? ep : API + (ep.startsWith('/') ? ep : '/' + ep);
    const url = new URL(path);
    if (sig) url.searchParams.set('signature', sig);
    const r = await fetch(url.toString(), {
      method: post.method || 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: post.body ? JSON.stringify(post.body) : undefined
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j.error || j.message || 'Signature post failed.');
    }
  }
  onStatus('Signed.', 'working', { phase: 'signed' });
}

/**
 * Execute a quoted swap: switch chain, confirm each step in the wallet, then settle.
 * Same-chain routes (0x / nordstern) are confirmed via tx receipt — Relay intent-status
 * often stays "waiting" forever for those and used to leave the UI stuck on Settling.
 * onStatus(message, kind, extra) — kind is working | ok | error | info.
 */
export async function runSwap({ prov, acct, payTok, recvTok, w, slip, quote }, onStatus = () => {}) {
  const body = swapBody({ acct, payTok, recvTok, w, slip });
  const sameChain = payTok.chainId === recvTok.chainId;
  onStatus('Preparing route…', 'working', { phase: 'prepare' });
  await ensureChain(prov, payTok.chainId);
  const x = await call('/api/swap/execute', { method: 'POST', body: JSON.stringify(body) });
  if (x.swapsEnabled === false || x.executionAllowed === false) {
    throw new Error(x.note || x.error || 'Swaps temporarily unavailable.');
  }
  const q = x.quote || x;
  const rid = q.requestId || x.requestId;
  const steps = q.steps || x.steps || [];
  let tx = null;
  let sent = 0;

  for (const s of steps) {
    const kind = String(s.kind || 'transaction').toLowerCase();
    for (const it of s.items || []) {
      if (/^complete/i.test(it.status || '')) continue;

      if (kind === 'signature') {
        await signStepItem(prov, acct, it, onStatus);
        continue;
      }

      const d = stepData(it);
      if (!d?.to) {
        // Relay sometimes returns the step shell before calldata is ready.
        throw new Error('Route is not ready to sign yet. Get a fresh quote and try again.');
      }

      const chainId = Number(d.chainId || payTok.chainId);
      if (chainId) await ensureChain(prov, chainId);

      const label = /approve/i.test(s.id || '')
        ? 'Confirm approval in wallet…'
        : /deposit/i.test(s.id || '')
          ? 'Confirm deposit in wallet…'
          : 'Confirm swap in wallet…';
      onStatus(label, 'working', { phase: 'sign', step: s.id });

      // Let the wallet estimate gas — quoted gas is often stale and can block the prompt.
      const params = {
        from: acct,
        to: d.to,
        data: d.data || '0x',
        value: toHexQuantity(d.value) || '0x0'
      };
      tx = await prov.request({ method: 'eth_sendTransaction', params: [params] });
      sent += 1;
      onStatus('Submitted ' + tx.slice(0, 10) + '…', 'working', { phase: 'sent', tx });

      onStatus('Waiting for confirmation…', 'working', { phase: 'receipt', tx });
      const receipt = await waitReceipt(prov, tx);
      if (!receipt) throw new Error('Transaction not confirmed. Check your wallet / explorer.');
      if (receipt.status === '0x0' || receipt.status === 0) {
        throw new Error('Transaction reverted. Nothing received.');
      }
    }
  }

  if (!sent && !tx) {
    throw new Error('No wallet transaction was returned for this route. Try again or another pay token.');
  }

  if (rid && tx) {
    call('/api/swap/status', {
      method: 'POST',
      body: JSON.stringify({
        requestId: rid,
        wallet: acct,
        originChainId: payTok.chainId,
        destinationChainId: recvTok.chainId,
        inputToken: payTok.address,
        outputToken: recvTok.address,
        inputAmount: w,
        estimatedOutput: quote?.receiveAmount,
        txHash: tx,
        status: 'submitted'
      })
    }).catch(() => {});
  }

  // Same-chain DEX routes settle when the swap tx confirms — don't wait on Relay intent.
  if (sameChain) {
    onStatus('Success ✓', 'ok', { phase: 'done', tx });
    return { ok: true, tx };
  }

  if (!rid) {
    onStatus('Success ✓', 'ok', { phase: 'done', tx });
    return { ok: true, tx };
  }

  for (let i = 0; i < 90; i++) {
    onStatus('Bridging / filling…', 'working', { phase: 'settle', i, n: 90, tx });
    await sleep(2000);
    try {
      const s = String(
        (await call('/api/swap/intent-status?requestId=' + encodeURIComponent(rid))).status || ''
      ).toLowerCase();
      if (/success|complete|filled/.test(s)) {
        onStatus('Success ✓', 'ok', { phase: 'done', tx });
        return { ok: true, tx };
      }
      if (/fail|refund|error/.test(s)) {
        onStatus('Swap failed.', 'error', { phase: 'failed', tx });
        return { ok: false, tx };
      }
    } catch (_) {}
  }
  onStatus('Still filling — check the explorer.', 'info', { phase: 'slow', tx });
  return { ok: null, tx };
}
