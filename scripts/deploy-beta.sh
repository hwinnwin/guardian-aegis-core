#!/usr/bin/env bash
set -euo pipefail
command- -v gh >/dev/null || { echo "❌ gh CLI required"; exit 1; }

echo "▶ Triggering Dashboard beta deploy…"
gh workflow run cd-dashboard.yml -f channel=beta || true

echo "▶ Triggering Extension beta publish…"
gh workflow run cd-extension.yml -f channel=beta || true

echo "ℹ Check Actions tab for progress."
