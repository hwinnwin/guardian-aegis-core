#!/usr/bin/env bash
# Rebase current branch onto main to unify histories cleanly.
# Run once, resolve conflicts as needed, then push with --force-with-lease.
set -euo pipefail

echo "⚙️ Fetching origin/main…"
git fetch origin main
BRANCH="$(git branch --show-current)"
BASE="$(git merge-base "$BRANCH" main 2>/dev/null || true)"

if [ -z "${BASE:-}" ]; then
  echo "ℹ️ Histories appear unrelated; rebasing entire branch onto main."
  git rebase --rebase-merges --root --onto main
else
  echo "➡️ Rebasing ${BRANCH} onto main (base=$BASE)…"
  git rebase --rebase-merges --onto main "$BASE" "$BRANCH"
fi

echo "✅ Rebase complete. Review changes, then push with:"
echo "   git push --force-with-lease origin ${BRANCH}"
