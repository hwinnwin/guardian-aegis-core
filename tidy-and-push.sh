#!/usr/bin/env bash
set -euo pipefail

BRANCH="${BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
COMMIT_MSG="${COMMIT_MSG:-chore(repo): tidy workspace, untrack artifacts, push clean state}"
DRY_RUN="${DRY_RUN:-0}"

git rev-parse --is-inside-work-tree >/dev/null || { echo "❌ Not a git repo"; exit 1; }
git remote get-url origin >/dev/null 2>&1 || { echo "❌ No 'origin' remote configured"; exit 1; }

echo "📦 Branch: $BRANCH"
echo "🧹 Dry run: $([ "$DRY_RUN" = "1" ] && echo YES || echo NO)"

touch .gitignore
ensure_line() { grep -qxF "$1" .gitignore 2>/dev/null || echo "$1" >> .gitignore; }

echo "📝 Updating .gitignore…"
ensure_line ".DS_Store"
ensure_line "*.swp"
ensure_line "*.log"
ensure_line "dist/"
ensure_line "build/"
ensure_line ".turbo/"
ensure_line ".vite/"
ensure_line ".parcel-cache/"
ensure_line ".pnpm-store/"
ensure_line ".env"
ensure_line ".env.local"
ensure_line ".env.*.local"
ensure_line "bench-buffer.json"
ensure_line "bench-buffer.out"
ensure_line "bench-buffer.sha256"
ensure_line "coverage/"
ensure_line "tmp/"
ensure_line ".tmp/"
ensure_line "package-lock.json"
ensure_line "yarn.lock"
ensure_line "bun.lockb"

echo "🔧 Enforcing PNPM lockfile policy…"
rm -f package-lock.json yarn.lock bun.lockb 2>/dev/null || true
if [ -f pnpm-lock.yaml ]; then
  git add -f pnpm-lock.yaml
fi

echo "🧼 Untracking committed artifacts (cached only)…"
TO_UNTRACK=(
  ".DS_Store"
  "dist"
  "build"
  ".turbo"
  ".vite"
  ".parcel-cache"
  ".pnpm-store"
  "bench-buffer.json"
  "bench-buffer.out"
  "bench-buffer.sha256"
  "coverage"
  "tmp"
  ".tmp"
  "package-lock.json"
  "yarn.lock"
  "bun.lockb"
)
for p in "${TO_UNTRACK[@]}"; do
  if git ls-files --error-unmatch "$p" >/dev/null 2>&1; then
    echo "  - git rm --cached -r $p"
    if [ "$DRY_RUN" != "1" ]; then
      git rm --cached -r "$p" >/dev/null
    fi
  fi
done

mkdir -p scripts
cat > scripts/repo-tidy.sh <<'SH'
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
SH
chmod +x scripts/repo-tidy.sh
git add scripts/repo-tidy.sh .gitignore || true

if jq -e '.scripts.format' package.json >/dev/null 2>&1; then
  echo "🎨 Running formatter (pnpm format)…"
  if [ "$DRY_RUN" != "1" ]; then
    pnpm -w run format || echo "⚠️ format script failed/absent—continuing"
  fi
fi

echo "🧩 Staging all changes…"
git add -A

if git diff --cached --quiet; then
  echo "✅ Nothing to commit — working tree clean."
else
  echo "💾 Creating commit…"
  if [ "$DRY_RUN" != "1" ]; then
    git commit -m "$COMMIT_MSG"
  fi
fi

echo "🌐 Syncing with remote…"
git fetch origin "$BRANCH" || true
if ! git ls-remote --exit-code origin "$BRANCH" >/dev/null 2>&1; then
  echo "🪄 Creating remote branch $BRANCH"
  if [ "$DRY_RUN" != "1" ]; then
    git push -u origin "$BRANCH"
  fi
else
  echo "🚀 Pushing to origin/$BRANCH"
  if [ "$DRY_RUN" != "1" ]; then
    git push origin "$BRANCH"
  fi
fi

echo ""
echo "✅ Repo tidy + push complete."
echo "   Branch: $BRANCH"
echo "   Commit: $COMMIT_MSG"
echo "👉 Ready for Lovable to start UI work."
