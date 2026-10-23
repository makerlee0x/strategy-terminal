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

/**
 * Execute a quoted swap: switch chain, send each step's transaction, then poll until it settles.
 * onStatus(message, kind, extra) — kind is working | ok | error | info.
 */
export async function runSwap({ prov, acct, payTok, recvTok, w, slip, quote }, onStatus = () => {}) {
  const body = swapBody({ acct, payTok, recvTok, w, slip });
  await ensureChain(prov, payTok.chainId);
  const x = await call('/api/swap/execute', { method: 'POST', body: JSON.stringify(body) });
  if (!x.executionAllowed && x.swapsEnabled === false) throw new Error(x.note || 'Swaps disabled.');
  const q = x.quote || x;
  const rid = q.requestId || x.requestId;
  let tx = null;
  for (const s of q.steps || x.steps || []) {
    for (const it of s.items || []) {
      if (/complete/.test(it.status || '')) continue;
      const d = { ...it.data };
      delete d.nonce;
      delete d.gasPrice;
      delete d.maxFeePerGas;
      delete d.maxPriorityFeePerGas;
      if (!d.to) continue;
      onStatus('Confirm in wallet…', 'working', { phase: 'sign' });
      tx = await prov.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: acct,
            to: d.to,
            data: d.data || '0x',
            value: d.value ? '0x' + BigInt(d.value).toString(16) : '0x0',
            ...(d.gas || d.gasLimit
              ? { gas: '0x' + BigInt(d.gas || d.gasLimit).toString(16) }
              : {})
          }
        ]
      });
      onStatus('Submitted ' + tx.slice(0, 10) + '…', 'working', { phase: 'sent', tx });
    }
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
        estimatedOutput: quote.receiveAmount,
        txHash: tx,
        status: 'submitted'
      })
    }).catch(() => {});
  }
  if (!rid) return { ok: !!tx, tx };
  for (let i = 0; i < 90; i++) {
    onStatus('Settling…', 'working', { phase: 'settle', i, n: 90, tx });
    await new Promise((r) => setTimeout(r, 2000));
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
  onStatus('Still settling — check the explorer.', 'info', { phase: 'slow', tx });
  return { ok: null, tx };
}
