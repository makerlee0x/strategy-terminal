import { preflight, cachedFetch, json } from '../../../lib/guard';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
const RPC = process.env.NEXT_PUBLIC_ROBINHOOD_CHAIN_RPC_URL || 'https://rpc.mainnet.chain.robinhood.com';
const MSTR = '0xec262a75e413fafd0df80480274532c79d42da09';
const TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', ZERO32 = '0x' + '0'.repeat(64);
const CHUNK = 10_000_000; // RPC max block span per eth_getLogs
async function rpc(method, params, tries = 5) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(RPC, { method: 'POST', cache: 'no-store', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }).then(r => r.json()).catch(e => ({ error: { message: e.message } }));
    if (!r.error) return r.result;
    if (!/too many|rate/i.test(r.error.message || '') || i === tries - 1) throw new Error(r.error.message);
    await new Promise(z => setTimeout(z, 1500 * (i + 1)));
  }
}
const ARB_RPC = 'https://arbitrum-one-rpc.publicnode.com';
const ARB = { MSTRx: '0xae2f842ef90c0d5213259ab82639d5bbf649b08e', rMSTR: '0x10fe806857055d3b5ae00d2eabafd3e61f0e89aa', 'MSTR.d': '0xdf7a6ce3b9087251f5859f42ca79ce34f4a88460' };
async function arbSupplies() { const out = {}; await Promise.all(Object.entries(ARB).map(async ([k, a]) => { try { const r = await fetch(ARB_RPC, { method: 'POST', cache: 'no-store', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: a, data: '0x18160ddd' }, 'latest'] }) }).then(r => r.json()); out[k] = r.result ? toNum(r.result) : null; } catch (_) { out[k] = null; } })); return out; }
const toNum = (hex, d = 18) => Number(BigInt(hex) / 10n ** BigInt(d - 4)) / 1e4;
// Incremental mint/burn scan kept per server instance.
const scan = { next: 0, mint: 0n, burn: 0n, mintN: 0, burnN: 0, running: null, at: 0 };
async function runScan() {
  const head = parseInt(await rpc('eth_blockNumber', []), 16);
  while (scan.next <= head) {
    const from = scan.next, to = Math.min(head, from + CHUNK - 1);
    for (const [k, topics] of [['mint', [TRANSFER, ZERO32]], ['burn', [TRANSFER, null, ZERO32]]]) {
      const logs = await rpc('eth_getLogs', [{ address: MSTR, fromBlock: '0x' + from.toString(16), toBlock: '0x' + to.toString(16), topics }]);
      for (const l of logs) { scan[k] += BigInt(l.data); scan[k + 'N']++; }
      await new Promise(z => setTimeout(z, 400));
    }
    scan.next = to + 1;
  }
  scan.at = Date.now(); scan.head = head;
}
function kick() { if (!scan.running && Date.now() - scan.at > 600_000) scan.running = runScan().catch(() => {}).finally(() => { scan.running = null; }); return scan.running; }
export async function OPTIONS(req) { return preflight(req); }
export async function GET(req) {
  const pf = preflight(req, { browser: { limit: 30 }, anon: { limit: 10 }, prefix: 'rh' }); if (pf) return pf;
  const origin = req.headers.get('origin') || '';
  try {
    const { value } = await cachedFetch('rh-mstr-core', 120_000, async () => {
      const [supply, mult] = await Promise.all([rpc('eth_call', [{ to: MSTR, data: '0x18160ddd' }, 'latest']), rpc('eth_call', [{ to: MSTR, data: '0xa60bf13d' }, 'latest'])]);
      return { supply: toNum(supply), uiMultiplier: Number(BigInt(mult)) / 1e18, arbitrum: await arbSupplies() };
    });
    const p = kick(); if (p && !scan.at) await Promise.race([p, new Promise(z => setTimeout(z, 8000))]);
    const done = !!scan.at;
    return json({ ok: true, source: 'robinhood-rpc', token: MSTR, fetchedAt: new Date().toISOString(), ...value,
      mintBurn: done ? { minted: Number(scan.mint / 10n ** 14n) / 1e4, burned: Number(scan.burn / 10n ** 14n) / 1e4, mintEvents: scan.mintN, burnEvents: scan.burnN, throughBlock: scan.head, scannedAt: new Date(scan.at).toISOString() } : null,
      scanning: !!scan.running }, { origin, sMaxAge: 120 });
  } catch (e) { return json({ ok: false, delayed: true, error: 'rpc_unavailable' }, { origin, sMaxAge: 15 }); }
}
