import { json } from '../../../../lib/guard';
import { poolBacking } from '../../../../lib/poolBacking';
import { kv, kvConfigured } from '../../../../lib/kv';
import { record } from '../../../../lib/metrics.mjs';
export const dynamic = 'force-dynamic';
// Daily STRATEGY snapshot (Vercel Cron, see vercel.json). Stores one record per UTC day in KV hash `strategy:daily`.
export async function GET(req) {
  if (!process.env.CRON_SECRET || req.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) return json({ ok: false, error: 'unauthorized' }, { status: 401, sMaxAge: 0 });
  if (!kvConfigured()) return json({ ok: false, error: 'kv_not_configured' }, { status: 503, sMaxAge: 0 });
  try {
    const r = record(await poolBacking());
    await kv(['HSET', 'strategy:daily', r.d, JSON.stringify(r)]);
    return json({ ok: true, saved: r }, { sMaxAge: 0 });
  } catch (e) { console.error('cron snapshot', e && e.message); return json({ ok: false, error: 'snapshot_failed' }, { status: 502, sMaxAge: 0 }); }
}
