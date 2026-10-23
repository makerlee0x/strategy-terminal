import { preflight, cachedFetch, lastGood, json } from '../../../lib/guard';
import { kv, kvConfigured } from '../../../lib/kv';
import seed from '../../../data/history-seed.json';
import { poolBacking } from '../../../lib/poolBacking';
import { record } from '../../../lib/metrics.mjs';
export const dynamic = 'force-dynamic';
// Daily $STRATEGY records: data/history-seed.json (backfilled past days, if any) merged with the daily snapshots in KV.
// Real data only: with nothing recorded yet, days is empty and the page says the history is building.
export async function OPTIONS(req) { return preflight(req); }
export async function GET(req) {
  const pf = preflight(req, { browser: { limit: 30 }, anon: { limit: 10 }, prefix: 'history' }); if (pf) return pf;
  const origin = req.headers.get('origin') || '';
  try {
    const { value } = await cachedFetch('strategy-history', 600_000, async () => {
      const by = {}; for (const r of seed) by[r.d] = r;
      if (kvConfigured()) { const flat = await kv(['HGETALL', 'strategy:daily']) || []; for (let i = 0; i < flat.length; i += 2) { const r = JSON.parse(flat[i + 1]); by[r.d] = r; } }
      // Start recording as soon as KV is connected: if today has no snapshot yet, store one now (the nightly cron keeps it going).
      const today = new Date().toISOString().slice(0, 10);
      if (kvConfigured() && !by[today]) { try { const r = record(await poolBacking()); await kv(['HSETNX', 'strategy:daily', r.d, JSON.stringify(r)]); by[r.d] = r; } catch (_) {} }
      const days = Object.values(by).sort((a, b) => a.d < b.d ? -1 : 1);
      return { ok: true, source: kvConfigured() ? 'kv' : 'none', kv: kvConfigured(), fetchedAt: new Date().toISOString(), since: days[0]?.d || null, days };
    });
    return json(value, { origin, sMaxAge: 300 });
  } catch (e) { console.error('history', e && e.message); const lg = lastGood('strategy-history'); return json(lg ? { ...lg.value, ok: false, delayed: true } : { ok: false, delayed: true, days: [] }, { origin, sMaxAge: 15 }); }
}
