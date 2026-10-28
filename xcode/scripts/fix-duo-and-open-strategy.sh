#!/usr/bin/env bash
# Run this ON YOUR MAC (not in the cloud agent).
# Fixes the Autosave-path project, installs iPhone Duo Simulator devices,
# and opens STRATEGY against cover or open Duo.
set -euo pipefail

AUTOSAVE_SRC="${AUTOSAVE_SRC:-$HOME/Library/Autosave Information/strategy}"
DEST="${DEST:-$HOME/Developer/strategy}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PKG_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MODE="${1:-cover}" # cover | open | safari-cover | safari-open

echo "==> Xcode / simctl check"
command -v xcrun >/dev/null || { echo "Xcode CLT / xcrun missing. Open Xcode once, then: xcode-select -s /Applications/Xcode.app"; exit 1; }
xcrun simctl help >/dev/null

echo "==> Rescue project out of Autosave Information"
mkdir -p "$(dirname "$DEST")"
if [[ -d "$AUTOSAVE_SRC" ]]; then
  if [[ -e "$DEST" ]]; then
    echo "    Destination already exists: $DEST (leaving in place)"
  else
    cp -R "$AUTOSAVE_SRC" "$DEST"
    echo "    Copied → $DEST"
  fi
else
  echo "    Autosave project not found at: $AUTOSAVE_SRC"
fi

# Prefer packaged sources if Autosave copy looks empty/broken
if [[ ! -f "$DEST/strategy.xcodeproj/project.pbxproj" ]]; then
  echo "    Installing packaged STRATEGY app → $DEST"
  mkdir -p "$DEST"
  rsync -a "$PKG_ROOT/strategy/" "$DEST/"
fi

echo "==> Install iPhone Duo device types"
DEV_TYPES="$HOME/Library/Developer/CoreSimulator/Profiles/DeviceTypes"
mkdir -p "$DEV_TYPES"
rsync -a "$PKG_ROOT/DuoDevices/" "$DEV_TYPES/"
echo "    Installed:"
ls -1 "$DEV_TYPES" | grep -i 'Duo' || true

# CoreSimulator caches device types; bounce the service so new types appear
killall -9 com.apple.CoreSimulator.CoreSimulatorService 2>/dev/null || true
sleep 1

echo "==> Available runtimes"
RUNTIME="$(xcrun simctl list runtimes -j | python3 -c '
import json,sys
d=json.load(sys.stdin)
cands=[r["identifier"] for r in d.get("runtimes",[]) if r.get("isAvailable") and "iOS" in r.get("name","")]
print(cands[-1] if cands else "")
')"
if [[ -z "$RUNTIME" ]]; then
  echo "No iOS Simulator runtime found. In Xcode: Settings → Platforms → download iOS."
  exit 1
fi
echo "    Using runtime: $RUNTIME"

udid_for_name() {
  xcrun simctl list devices available | grep -F "$1 (" | head -1 | grep -oE '[A-F0-9-]{36}' || true
}

create_if_missing() {
  local name="$1" type_id="$2"
  local existing
  existing="$(udid_for_name "$name")"
  if [[ -n "$existing" ]]; then
    echo "    Device exists: $name ($existing)" >&2
    printf '%s' "$existing"
    return
  fi
  local udid
  if udid="$(xcrun simctl create "$name" "$type_id" "$RUNTIME" 2>/dev/null)"; then
    echo "    Created: $name ($udid)" >&2
    printf '%s' "$udid"
    return
  fi
  # Fallback: closest stock phone if custom type rejected by this Xcode
  echo "    WARN: custom type $type_id rejected — falling back to iPhone 16 Pro" >&2
  local fallback_type="com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro"
  if ! xcrun simctl list devicetypes | grep -q 'iPhone-16-Pro'; then
    fallback_type="$(xcrun simctl list devicetypes | grep -i 'iPhone' | tail -1 | sed -n 's/.*(\(.*\))/\1/p')"
  fi
  udid="$(xcrun simctl create "$name" "$fallback_type" "$RUNTIME")"
  echo "    Created fallback: $name ($udid)" >&2
  printf '%s' "$udid"
}

COVER_UDID="$(create_if_missing "iPhone Duo Cover" "com.apple.CoreSimulator.SimDeviceType.iPhone-Duo-Cover")"
OPEN_UDID="$(create_if_missing "iPhone Duo Open" "com.apple.CoreSimulator.SimDeviceType.iPhone-Duo-Open")"

SAFARI=0
case "$MODE" in
  cover) UDID="$COVER_UDID" ;;
  open) UDID="$OPEN_UDID" ;;
  safari-cover) UDID="$COVER_UDID"; SAFARI=1 ;;
  safari-open) UDID="$OPEN_UDID"; SAFARI=1 ;;
  *) echo "Usage: $0 [cover|open|safari-cover|safari-open]"; exit 1 ;;
esac

echo "==> Boot Simulator: $MODE ($UDID)"
open -a Simulator
xcrun simctl boot "$UDID" 2>/dev/null || true
xcrun simctl bootstatus "$UDID" -b
if [[ "$MODE" == *open* ]]; then
  echo "    Tip: Simulator → Device → Rotate Left for unfolded landscape"
fi

PROJECT="$DEST/strategy.xcodeproj"
echo "==> Open Xcode project: $PROJECT"
open "$PROJECT"

if [[ "$SAFARI" == "1" ]]; then
  echo "==> Open Safari → strategycoin.io on Duo"
  xcrun simctl openurl "$UDID" "https://www.strategycoin.io/"
else
  echo "==> Build & run STRATEGY on Duo"
  if xcodebuild \
    -project "$PROJECT" \
    -scheme strategy \
    -destination "id=$UDID" \
    -configuration Debug \
    CODE_SIGNING_ALLOWED=NO \
    build; then
    APP="$(find ~/Library/Developer/Xcode/DerivedData -path '*/Build/Products/Debug-iphonesimulator/STRATEGY.app' 2>/dev/null | head -1 || true)"
    if [[ -n "$APP" ]]; then
      xcrun simctl install "$UDID" "$APP"
      xcrun simctl launch "$UDID" io.strategycoin.app
      echo "    Launched STRATEGY on Duo"
    fi
  else
    echo "xcodebuild failed — in Xcode pick 'iPhone Duo Cover/Open', hit Run (⌘R)."
  fi
fi

echo
echo "Done."
echo "  Cover device: $COVER_UDID"
echo "  Open device:  $OPEN_UDID"
echo "  Project:      $PROJECT"
echo
echo "Local Next.js in Simulator:"
echo "  1) In strategy-terminal: npm run dev -- -H 0.0.0.0 -p 3000"
echo "  2) xcrun simctl openurl $UDID http://127.0.0.1:3000/"
