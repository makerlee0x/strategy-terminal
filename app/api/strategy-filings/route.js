import { preflight, cachedFetch, lastGood, json } from '../../../lib/guard';
import { loadFilings } from '../../../lib/filings';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export async function OPTIONS(req) { return preflight(req); }
export async function GET(req) {
  const pf = preflight(req, { browser: { limit: 30 }, anon: { limit: 10 }, prefix: 'filings' }); if (pf) return pf;
  const origin = req.headers.get('origin') || '';
  try { const { value } = await cachedFetch('filings', 3_600_000, loadFilings); return json(value, { origin, sMaxAge: 1800 }); }
  catch (e) { const lg = lastGood('filings'); return json(lg ? { ...lg.value, ok: false, delayed: true } : { ok: false, delayed: true }, { origin, sMaxAge: 30 }); }
}
