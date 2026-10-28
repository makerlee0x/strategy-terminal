# STRATEGY × iPhone Duo (Xcode)

This cloud agent **cannot** open macOS paths like:

`/Users/meador/Library/Autosave Information/strategy/strategy.xcodeproj`

Run the fix script **on your Mac** instead.

## One-shot fix (Mac Terminal)

From this repo (or after copying `xcode/` to your Mac):

```bash
chmod +x xcode/scripts/fix-duo-and-open-strategy.sh
./xcode/scripts/fix-duo-and-open-strategy.sh cover
```

Other modes:

```bash
./xcode/scripts/fix-duo-and-open-strategy.sh open
./xcode/scripts/fix-duo-and-open-strategy.sh safari-cover
./xcode/scripts/fix-duo-and-open-strategy.sh safari-open
```

What it does:

1. Copies the Autosave project out to `~/Developer/strategy` (Autosave is a bad place for a real project)
2. Falls back to the packaged WKWebView STRATEGY app if Autosave is incomplete
3. Installs **iPhone Duo Cover** + **iPhone Duo Open** Simulator device types
4. Creates/boots those devices
5. Opens the `.xcodeproj` and builds/runs (or Safari → strategycoin.io)

## Duo screen sizes

| Mode | Physical | CSS @3x |
|------|----------|---------|
| Cover (outer) | 1398×2034 | 466×678 |
| Open (inner, landscape) | 2670×1878 | 890×626 |

## Point Simulator at local strategy-terminal

```bash
# in strategy-terminal
npm run dev -- -H 0.0.0.0 -p 3000

# then
xcrun simctl openurl booted http://127.0.0.1:3000/
```

Or set scheme env `STRATEGY_LOCAL=1` so the STRATEGY app loads localhost.
