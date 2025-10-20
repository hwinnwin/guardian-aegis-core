#!/usr/bin/env bash
set -euo pipefail
echo "🧽 Repo tidy: removing tracked artifacts & enforcing PNPM…"
rm -f package-lock.json yarn.lock bun.lockb 2>/dev/null || true
git rm --cached -r \
  dist build .turbo .vite .parcel-cache .pnpm-store \
  bench-buffer.json bench-buffer.out bench-buffer.sha256 \
  coverage tmp .tmp 2>/dev/null || true
[ -f pnpm-lock.yaml ] && git add -f pnpm-lock.yaml
echo "✅ Tidy complete. Review changes with: git status"
