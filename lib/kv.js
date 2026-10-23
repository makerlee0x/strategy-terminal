// Minimal Upstash Redis REST client (Vercel KV uses the same API). No dependency.
// Env: KV_REST_API_URL + KV_REST_API_TOKEN (Vercel KV / Upstash integration), or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.
const URL_ = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
export const kvConfigured = () => !!(URL_() && TOKEN());
/** Run one Redis command, e.g. kv(['HSET', 'key', 'field', 'value']). */
export async function kv(cmd) {
  const r = await fetch(URL_(), { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN(), 'Content-Type': 'application/json' }, body: JSON.stringify(cmd), cache: 'no-store', signal: AbortSignal.timeout(10_000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error('kv ' + (j.error || r.status));
  return j.result;
}
