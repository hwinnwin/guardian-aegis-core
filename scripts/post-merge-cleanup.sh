#!/usr/bin/env bash
set -euo pipefail

WF=".github/workflows/release-prep.yml"

if [ ! -f "$WF" ]; then
  echo "::error::${WF} not found"
  exit 1
fi

echo "🔧 Removing temporary ci/changelog-machine-enforce trigger…"
tmp="$(mktemp)"
awk '!/ci\/changelog-machine-enforce/' "$WF" > "$tmp"
mv "$tmp" "$WF"

git add "$WF"
git commit -m "ci(release-prep): remove temporary trigger (histories unified)" || true

if git rev-parse "v0.9-preflight" >/dev/null 2>&1; then
  echo "ℹ️ Tag v0.9-preflight already exists; skipping tag creation."
else
  echo "🏷️ Tagging v0.9-preflight…"
  git tag -a v0.9-preflight -m "Preflight checkpoint: Release Prep verified; Detector Health integrated"
fi

echo "➡️ Push updates with:"
echo "   git push origin HEAD"
echo "   git push origin v0.9-preflight"
