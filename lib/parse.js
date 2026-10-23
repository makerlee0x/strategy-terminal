// Parse STS display strings ("$1.86M", "4.25%", "2,857", "1.00B") into numbers.
export function parseDisplay(v) {
  if (v == null) return null; if (typeof v === 'number') return v;
  const s = String(v).trim().replace(/[$,\s]/g, ''); if (!s || s === '—' || s === '-') return null;
  const m = s.match(/^(-?[0-9]*\.?[0-9]+)(%|[KMBT])?$/i); if (!m) return null;
  const n = parseFloat(m[1]), u = (m[2] || '').toUpperCase();
  return n * ({ K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[u] || 1);
}
