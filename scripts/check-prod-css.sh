#!/usr/bin/env bash
# After a merge/deploy: print the live CSS hash for strategycoin.io.
# Usage: ./scripts/check-prod-css.sh [expected-substring]
set -euo pipefail

URL="${PROD_URL:-https://www.strategycoin.io/}"
html="$(curl -fsSL "$URL")"
css="$(printf '%s' "$html" | grep -oE '_next/static/css/[a-f0-9]+\.css' | head -1 || true)"

if [[ -z "$css" ]]; then
  echo "No Next CSS asset found at $URL" >&2
  exit 1
fi

echo "live css: $css"
echo "url:      ${URL%/}/$css"

if [[ $# -ge 1 ]]; then
  if printf '%s' "$css" | grep -q -- "$1"; then
    echo "match:    ok ($1)"
  else
    echo "match:    MISS — expected substring '$1' not in live hash" >&2
    echo "hint:     deploy may still be rolling; retry in ~30s" >&2
    exit 2
  fi
fi
