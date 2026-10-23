// Build the static githack preview (branch `preview`) from the current source.
// Usage: node scripts/build-preview.mjs <out-dir> [snapshot-dir]
// The preview has no server, so API calls read JSON snapshots from <out-dir>/snapshot
// (copy them from the preview branch, or pass a folder of fresh ones).
import { cpSync, rmSync, readFileSync, writeFileSync, readdirSync, statSync, symlinkSync, mkdtempSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';

const ROOT = resolve(new URL('..', import.meta.url).pathname), OUT = resolve(process.argv[2] || 'preview-out'), SNAP = process.argv[3] && resolve(process.argv[3]);
const BASE = '/makerlee0x/strategy/preview', CDN = 'https://raw.githack.com/makerlee0x/strategy/preview';
const walk = d => readdirSync(d).flatMap(f => statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]);
const edit = (f, fn) => writeFileSync(f, fn(readFileSync(f, 'utf8')));

const W = mkdtempSync(join(tmpdir(), 'preview-'));
for (const f of ['app', 'lib', 'data', 'public', 'package.json', 'next.config.js']) cpSync(join(ROOT, f), join(W, f), { recursive: true });
symlinkSync(join(ROOT, 'node_modules'), join(W, 'node_modules'));
rmSync(join(W, 'app/api'), { recursive: true });
rmSync(join(W, 'app/share'), { recursive: true }); // share links need the image routes, which only exist on the live site

// API routes → snapshot files: /api/chains → snapshot/chains.json
edit(join(W, 'lib/useLive.js'), s => s.replace("fetch(u,", `fetch('${BASE}/snapshot/' + u.replace(/^\\/api\\//, '').replace(/[?&=]/g, '_') + '.json',`));
// Internal links and images → githack paths
for (const f of walk(join(W, 'app')).filter(f => f.endsWith('.js'))) edit(f, s => s
  .replace(/(href|src)="\/([^"]*)"/g, (m, a, p) => `${a}="${BASE}/${p.replace(/^(#|$)/, 'index.html$1').replace(/\/(#|$)/, '/index.html$1')}"`));
// Footer stamp so the preview never passes for live data
const snapDir = SNAP || join(OUT, 'snapshot'), at = JSON.parse(readFileSync(join(snapDir, 'strategy-metrics.json'), 'utf8')).fetchedAt;
const stamp = at ? new Date(at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' }) + ' CT' : 'date unknown';
edit(join(W, 'app/layout.js'), s => s.replace('<span className="foot-links">', `<span>Preview · data snapshot ${stamp}</span><span className="foot-links">`));
// No server in the preview: first renders read the snapshot files instead of calling the API handlers
writeFileSync(join(W, 'lib/ssr.js'), `import { readFileSync } from 'node:fs';
export async function initial(urls) { const o = {}; for (const u of urls) { try { o[u] = JSON.parse(readFileSync(${JSON.stringify(snapDir)} + '/' + u.replace(/^\\/api\\//, '').replace(/[?&=]/g, '_') + '.json', 'utf8')); } catch (_) {} } return o; }
`);
for (const f of walk(join(W, 'app')).filter(f => f.endsWith('page.js'))) edit(f, s => s.replace(/^export const revalidate = \d+;\n/m, ''));
edit(join(W, 'next.config.js'), s => s.replace('module.exports = {', `module.exports = {\n  output: 'export', trailingSlash: true, assetPrefix: '${CDN}',`).replace(/  async (headers|redirects)\(\) \{[\s\S]*?\n  \},?\n/g, ''));

execSync('npx next build', { cwd: W, stdio: 'inherit' });
const prevSnap = existsSync(join(OUT, 'snapshot')) ? mkdtempSync(join(tmpdir(), 'snap-')) : null;
if (prevSnap) cpSync(join(OUT, 'snapshot'), prevSnap, { recursive: true });
for (const f of readdirSync(OUT).filter(f => f !== '.git')) rmSync(join(OUT, f), { recursive: true });
cpSync(join(W, 'out'), OUT, { recursive: true });
cpSync(SNAP || prevSnap, join(OUT, 'snapshot'), { recursive: true });
// No history store in the static preview: an empty history, like the live site before its first snapshot
writeFileSync(join(OUT, 'snapshot/strategy-history.json'), JSON.stringify({ ok: true, source: 'none', fetchedAt: new Date().toISOString(), since: null, days: [] }));
writeFileSync(join(OUT, '.nojekyll'), '');
console.log('Preview built in', OUT);
