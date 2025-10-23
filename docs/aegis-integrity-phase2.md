<!-- phase_id: aegis_phase2_integrity_recovery -->
# Aegis Integrity Recovery Plan — Phase 2

## Summary
- Launch gate remains 99.99 % (advisory floor 99.90 %); this playbook restores failing and missing inputs ahead of the next Aegis dispatch.
- Execute in sequence: Phase 2A (Lint & UI), Phase 2B (Cache & Detector), Phase 2C (Provenance & Docs), then aggregate artifacts and recompute the score.
- All collectors write JSON into `.aegis_audit/` and live under `tools/aegis/collect/*` for deterministic ingestion.

## Audit Variables & Evidence Map
- [ ] `WF_PIN` — Workflow Pin Integrity — Target ≥ 100 % — Evidence: `tools/aegis/collect/workflow-pin.mjs` ⇒ `.aegis_audit/workflow-pin.json`
- [ ] `CODE_TEST` — Unit + E2E Coverage — Target ≥ 90 % — Evidence: `pnpm -r test` summaries ⇒ `.aegis_audit/code-test.json`
- [ ] `WF_PERM` — Workflow Permissions Hygiene — Target ≥ 95 % — Evidence: `tools/aegis/collect/workflow-permissions.mjs`
- [ ] `WF_CONC` — Workflow Concurrency Guards — Target ≥ 90 % — Evidence: `tools/aegis/collect/workflow-concurrency.mjs`
- [ ] `PKG_PIN` — Dependency Determinism — Target ≥ 100 % — Evidence: `tools/aegis/collect/lock-integrity.mjs`
- [ ] `PROV_COV` — Provenance Coverage — Target ≥ 100 % — Evidence: `tools/aegis/collect/docs-provenance.mjs`
- [ ] `DOC_AUDIT` — Workflow Docs Sync — Target ≥ 100 % — Evidence: `tools/aegis/collect/docs-sync.mjs`
- [ ] `CODE_LINT` — Lint Pass Rate — Target 100 % — Evidence: `pnpm lint` report ⇒ `.aegis_audit/code-lint.json`
- [ ] `CODE_TYPES` — Type Safety — Target ≥ 98 % — Evidence: `pnpm exec tsc --noEmit`
- [ ] `DETECT_HEALTH` — Detector Health Score — Target ≥ 99.9 % — Evidence: `tools/aegis/collect/detector-health.mjs`
- [ ] `UI_QUALITY` — UI + Library Quality Gate — Target ≥ 99 % — Evidence: `tools/aegis/collect/ui-quality.mjs`
- [ ] `BENCH_BUFFER` — Buffer Benchmark Stability — Target ≥ 99.9 % — Evidence: `tools/aegis/collect/bench-buffer.mjs`
- [ ] `CACHE_HEALTH` — pnpm Cache Warmth — Target ≥ 95 % — Evidence: `tools/aegis/collect/cache-health.mjs`
- [ ] `SRC_DOC` — Docs Completeness — Target ≥ 99 % — Evidence: `tools/aegis/collect/docs-checklist.mjs`

---

## Phase 2A — Lint & UI Recovery

### 1. Eliminate `@typescript-eslint/no-explicit-any`
```bash
set -euo pipefail
pnpm exec ts-morph --transform require-to-import "./packages/**/*.ts"
pnpm exec ts-morph --transform require-to-import "./packages/**/*.tsx"
pnpm lint --max-warnings=0 || { echo "Lint failed"; exit 1; }
```
- Replace `any` with specific unions/interfaces; where intent is untyped data, add `unknown` plus safe narrowing.
- Remove empty blocks or add explanatory comments/logic to satisfy `no-empty`.
- Migrate `require()` usage to `import` syntax across TypeScript files (ts-morph preserves compiler options).

### 2. Re-run UI Quality Gate
```bash
set -euo pipefail
pnpm lint --filter @lumen-guardian/dashboard --max-warnings=0
pnpm -r test --filter @lumen-guardian/dashboard
pnpm exec tsc --noEmit --project packages/dashboard/tsconfig.json
node tools/aegis/collect/ui-quality.mjs
```
- Ensure the collector converts lint/test/typecheck status into normalized percentage at `.aegis_audit/ui-quality.json`.

---

## Phase 2B — Cache & Detector Recovery

### 3. Warm pnpm Cache & Capture Metrics
```bash
set -euo pipefail
pnpm fetch
pnpm install --offline --frozen-lockfile
node tools/aegis/collect/cache-health.mjs
```
- Collector should record cache hit ratio and store as `CACHE_HEALTH`.

### 4. Detector Health Snapshot
```bash
set -euo pipefail
export DHS_WINDOW_HOURS=24
node tools/aegis/collect/detector-health.mjs
```
- Gracefully handle missing Supabase credentials by emitting WARN = 0 with descriptive note.

### 5. Bench Buffer Stability
```bash
set -euo pipefail
pnpm bench:buffer:json
node tools/aegis/collect/bench-buffer.mjs bench-buffer.json
```
- Collect throughput, p95 latency, memory/op, and RSS; mark WARN if any breach configured thresholds.

---

## Phase 2C — Provenance & Documentation

### 6. Workflow Integrity Sweep
```bash
set -euo pipefail
node tools/aegis/collect/workflow-pin.mjs
node tools/aegis/collect/workflow-permissions.mjs
node tools/aegis/collect/workflow-concurrency.mjs
```
- Verify every workflow is SHA-pinned and permissions scoped to least privilege.
- Flag any missing `concurrency` guards or broad `permissions: write`.

### 7. Dependency Determinism & Docs Sync
```bash
set -euo pipefail
node tools/aegis/collect/lock-integrity.mjs
node tools/aegis/collect/docs-sync.mjs
```
- `lock-integrity.mjs` should verify `pnpm-lock.yaml` hash consistency and absence of `workspace:` leaks.
- `docs-sync.mjs` compares docs/AI_QC_WORKFLOW.md, README.md, and workflow comments for drift.

### 8. Provenance Consolidation
```bash
set -euo pipefail
node tools/aegis/collect/docs-provenance.mjs
```
- When `PROV_COV` > 0, clamp any `CD_CONF` value within the collector:
  ```js
  out.CD_CONF = Math.min(out.CD_CONF ?? 0, provCov ?? 0);
  ```
- Include reminder to rotate pinned GitHub Action SHAs at least quarterly or after runner image updates.

---

## Artifact Aggregation & Final Score
```bash
set -euo pipefail
node tools/aegis/aggregate-final-report.mjs
bash scripts/aegis-score.sh ".aegis_audit/final_audit_$(date -u +%Y%m%dT%H%M%SZ).log"
```
- `aggregate-final-report.mjs` merges collector outputs into `final_audit_<timestamp>.log` with PASS/WARN/FAIL counts.
- Re-run `scripts/aegis-score.sh` to surface the computed percentage in CI summaries.

---

## Post-Run Validation
- [ ] `pnpm lint` and `pnpm -r test` succeed with zero warnings.
- [ ] `pnpm exec tsc --noEmit` passes at workspace + package scopes.
- [ ] `.aegis_audit/` contains refreshed JSON for every variable.
- [ ] `final_audit_<timestamp>.log` reports ≥ 99.99 % (PASS) or ≥ 99.90 % (advisory) before dispatch.

## Maintenance Notes
- Review pinned GitHub Action SHAs quarterly and after any upstream security bulletin.
- Keep collectors deterministic; avoid network calls unless authenticated with scoped tokens.
- File naming convention: `tools/aegis/collect/<metric>.mjs` → `.aegis_audit/<metric>.json`.

## Completion Sign-off
- [ ] All Phase 2A/2B/2C steps executed chronologically.
- [ ] Aggregated audit uploaded to PR artifacts.
- [ ] Release owner acknowledges ≥ 99.99 % quality bar prior to triggering Aegis Final Audit.
