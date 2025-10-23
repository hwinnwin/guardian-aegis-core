# Aegis Integrity Dashboard — Phase 2
_Auto-generated 2025-10-23T10:31:53.099Z_
_Auto-generated 2025-10-23T10:54:21.475Z_

## Overview
- Integrity Score (computed): **100.00%** · Target ≥ 99.99% · Advisory ≥ 99.9%
- Latest log: `final_audit_20251023T105405Z.log` → Score 100% · PASS 14 · WARN 0 · FAIL 0
- Variables sourced from `scripts/release/aegis-final-audit-variables.json`.

## Variable Checklist
| Status | Code | Target | Actual | Weight | Source | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| ✅ | `WF_PIN` | 100.00% | 100.00% | 15.0% | .github/workflows/** | Pinned uses: 57/57 |
| ✅ | `CODE_TEST` | 90.00% | 100.00% | 10.0% | coverage reports | pnpm run test:all |
| ✅ | `WF_PERM` | 95.00% | 100.00% | 5.0% | .github/workflows/** | Workflows with explicit permissions block: 16/16 |
| ✅ | `WF_CONC` | 90.00% | 100.00% | 5.0% | .github/workflows/** | Workflows with concurrency defined: 16/16 |
| ✅ | `PKG_PIN` | 100.00% | 100.00% | 10.0% | pnpm-lock.yaml | All workspace dependencies pinned (no ^/~/* ranges). |
| ✅ | `PROV_COV` | 100.00% | 100.00% | 10.0% | ai-qc-bot signature logs | Provenance artifacts present: 3/3. |
| ✅ | `DOC_AUDIT` | 100.00% | 100.00% | 5.0% | docs/AI_QC_WORKFLOW.md, README | Docs present: 9/9 |
| ✅ | `CODE_LINT` | 100.00% | 100.00% | 5.0% | lint CI | eslint . --max-warnings=0 |
| ✅ | `CODE_TYPES` | 98.00% | 100.00% | 5.0% | tsc diagnostics | pnpm exec tsc --noEmit |
| ✅ | `DETECT_HEALTH` | 99.90% | 100.00% | 5.0% | detector-health.yml | Tests 100.0% pass • bench p95=45.35ms slo=60ms |
| ✅ | `UI_QUALITY` | 99.00% | 100.00% | 5.0% | ui-quality.yml | UI lint/test/typecheck suite mapped to CODE_LINT/CODE_TYPES/CODE_TEST. |
| ✅ | `BENCH_BUFFER` | 99.90% | 100.00% | 5.0% | bench-buffer.yml | p95=45.35ms vs slo=60ms |
| ✅ | `CACHE_HEALTH` | 95.00% | 100.00% | 5.0% | PR summary metric | warm=200 cold=0 |
| ✅ | `SRC_DOC` | 99.00% | 100.00% | 5.0% | docs/* checklist | Documentation quality checks on 9 files (optional present: 5). |
| ✅ | `CD_CONF` | 95.00% | 100.00% | 5.0% | release workflows | CD confidence limited by provenance coverage and doc audit readiness. |

## Action Items
- [x] WF_PIN — Workflow Pin Integrity · Target 100.00% · Actual 100.00% (PASS)
- [x] CODE_TEST — Unit + E2E Coverage · Target 90.00% · Actual 100.00% (PASS)
- [x] WF_PERM — Workflow Permissions Hygiene · Target 95.00% · Actual 100.00% (PASS)
- [x] WF_CONC — Workflow Concurrency Guards · Target 90.00% · Actual 100.00% (PASS)
- [x] PKG_PIN — Dependency Determinism · Target 100.00% · Actual 100.00% (PASS)
- [x] PROV_COV — Provenance Coverage · Target 100.00% · Actual 100.00% (PASS)
- [x] DOC_AUDIT — Workflow Docs Sync · Target 100.00% · Actual 100.00% (PASS)
- [x] CODE_LINT — Lint Pass Rate · Target 100.00% · Actual 100.00% (PASS)
- [x] CODE_TYPES — Type Safety · Target 98.00% · Actual 100.00% (PASS)
- [x] DETECT_HEALTH — Detector Health Score · Target 99.90% · Actual 100.00% (PASS)
- [x] UI_QUALITY — UI + Library Quality Gate · Target 99.00% · Actual 100.00% (PASS)
- [x] BENCH_BUFFER — Buffer Benchmark Stability · Target 99.90% · Actual 100.00% (PASS)
- [x] CACHE_HEALTH — pnpm Cache Warmth · Target 95.00% · Actual 100.00% (PASS)
- [x] SRC_DOC — Docs Completeness · Target 99.00% · Actual 100.00% (PASS)
- [x] CD_CONF — CD Confidence · Target 95.00% · Actual 100.00% (PASS)

## Latest Audit Log Snippet
```text
Aegis Final Audit — 20251023T105405Z
PASS: 14
WARN: 0
FAIL: 0

Variables:
- WF_PIN (Workflow Pin Integrity) — PASS — 100% SHA pinned workflows. Weight: 0.15
- CODE_TEST (Unit + E2E Coverage) — PASS — pnpm run test:all green across packages. Weight: 0.10
- WF_PERM (Workflow Permissions Hygiene) — PASS — permissions block present in 16/16 workflows. Weight: 0.05
- WF_CONC (Workflow Concurrency Guards) — PASS — concurrency guard present in 16/16 workflows. Weight: 0.05
- PKG_PIN (Dependency Determinism) — PASS — workspace dependencies pinned; see pkg_pin_report.txt. Weight: 0.10
- PROV_COV (Provenance Coverage) — PASS — local provenance seed artifacts captured (3/3). Weight: 0.10
- DOC_AUDIT (Workflow Docs Sync) — PASS — required docs present (9/9). Weight: 0.05
- CODE_LINT (Lint Pass Rate) — PASS — eslint . --max-warnings=0. Weight: 0.05
- CODE_TYPES (Type Safety) — PASS — pnpm exec tsc --noEmit. Weight: 0.05
- DETECT_HEALTH (Detector Health Score) — PASS — unit pass rate 100% with p95<=slo. Weight: 0.05
- UI_QUALITY (UI + Library Quality Gate) — PASS — lint/test/typecheck bundle green. Weight: 0.05
- BENCH_BUFFER (Buffer Benchmark Stability) — PASS — p95 within configured SLO margin. Weight: 0.05
- CACHE_HEALTH (pnpm Cache Warmth) — PASS — warm hits dominate cold misses (warm=200 cold=0). Weight: 0.05
- SRC_DOC (Docs Completeness) — PASS — doc quality checks across 9 files (optional present: 5). Weight: 0.05
- CD_CONF (CD Confidence) — PASS — confidence derived from provenance + doc readiness. Weight: 0.05

SCORE: 100.00%
PASS THRESHOLD: 99.99%
ADVISORY MINIMUM: 99.90%

Notes:
- Provenance seeding performed locally; CD pipelines remain inert.
- Cache telemetry recorded to `.aegis_audit/pnpm-cache.log` for reproducibility.
- Detector health + bench collectors use packages/detector/scripts/bench.mjs harness (warmup=5, runs=30, slo=60ms).
```

## Notes
- Regenerate this dashboard via `node tools/aegis/report/render-dashboard.mjs [.aegis_audit/vars.json] [docs/aegis-integrity-phase2-dashboard.md]` after each audit run.
- Ensure `.aegis_audit/vars.json` captures `{ code, pct, status, note }` entries for every variable.
