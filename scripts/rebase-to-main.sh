#!/usr/bin/env bash
# Rebase CI lineage onto main to unify histories cleanly.
#
# TEMP COMPAT PATCH NOTE:
#   Once this script completes successfully, remove the
#   temporary branch trigger in .github/workflows/release-prep.yml.

set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "This script must be run inside a git repository." >&2
  exit 1
fi

origin_url=$(git remote get-url origin 2>/dev/null || true)
if [[ -n "${origin_url:-}" ]]; then
  repo_slug=$(printf '%s' "$origin_url" | sed -E 's#.*[:/]([^/:]+/[^/]+)(\.git)?$#\1#')
  echo "📦 Repository: ${repo_slug}"
else
  echo "⚠️  Unable to detect origin remote. Double-check your remotes before pushing." >&2
fi

ci_branch=${1:-"ci/changelog-machine-enforce"}
main_branch=${2:-"main"}
current_branch=$(git rev-parse --abbrev-ref HEAD)

if [[ "$current_branch" != "$ci_branch" ]]; then
  echo "⚙️  Checking out CI branch ${ci_branch}..."
  git checkout "$ci_branch"
fi

updated_branch=$(git rev-parse --abbrev-ref HEAD)

echo "⚙️ Fetching origin/${main_branch}…"
git fetch origin "$main_branch"

merge_base=$(git merge-base "$updated_branch" "$main_branch" 2>/dev/null || true)

if [[ -z "${merge_base:-}" ]]; then
  echo "ℹ️ Histories appear unrelated; rebasing entire branch onto ${main_branch}."
  git rebase --rebase-merges --root --onto "$main_branch"
else
  echo "➡️ Rebasing ${updated_branch} onto ${main_branch} (base=${merge_base})…"
  git rebase --rebase-merges --onto "$main_branch" "$merge_base" "$updated_branch"
fi

echo "✅ Rebase complete. If conflicts occurred, resolve them and run 'git rebase --continue'."
echo "   When finished, verify the branch with CI, then push via:"
echo "     git push --force-with-lease origin ${updated_branch}"
