<!-- phase_id: aegis_phase3_harmony_continuous_audit -->
# Aegis Harmony Stabilization — Phase 3 Blueprint

## Mission Snapshot
- Sustain Guardian Aegis Integrity ≥ 99.99 % with daily variance ≤ 0.05 %.
- Keep Harmony health (detector + workflow + UX telemetry) ≥ 99.9 % over rolling 72 h.
- Automate guardrails so WARN states cannot linger > 1 cycle without escalation.

## Core Targets
- `INTEGRITY_SCORE` ≥ 99.99 % (no WARN variables).
- `HARMONY_SCORE` ≥ 99.90 % (detector health × workflow hygiene × UI telemetry).
- Time-to-detection for regressions ≤ 15 minutes (push) / ≤ 60 minutes (nightly).
- Automated rollback or issue escalation within 10 minutes of breach.

## Telemetry & Artifacts
- `.aegis_audit/vars.json` — enriched with Harmony metrics (`HARMONY_SCORE`, `HARMONY_VARIANCE`, `HARMONY_TREND`).
- `.aegis_audit/harmony-daily.jsonl` — append-only log (UTC) of daily score snapshots.
- `artifacts/harmony-badge.svg` — generated badge (brightgreen ≥ 99.99, green ≥ 99.9, yellow ≥ 99.5, orange ≥ 99, red < 99).
- `docs/aegis-harmony-phase3.md` (this file) — operational runbook.
- `docs/aegis-integrity-phase2-dashboard.md` — includes Harmony row after collector update.

## Phase 3 Execution Flow

### Phase 3A — Detector & Workflow Harmonization
1. **Collector Enhancements**
   - Extend `tools/aegis/collect/detector-health.mjs` to surface `healthPct`, `errorRate`, `coveragePct`, `e2eMeta`.
   - Create `tools/aegis/collect/workflow-harmony.mjs` that audits:
     - Action SHA pinning coverage (WF_PIN).
     - Permissions scope violations (WF_PERM).
     - Concurrency guard compliance (WF_CONC).
   - Write combined output to `.aegis_audit/harmony.json`.
2. **Quality Gates**
   - Update Integrity workflow to run both collectors and merge results into `vars.json` with weighted contributions for `HARMONY_SCORE`.
   - Guard: fail CI if harmony score < 99.9 % or missing metrics.

### Phase 3B — Continuous Audit Orchestration
1. **Nightly Harmony Workflow**
   - New GitHub Action `aegis-harmony-nightly.yml` (runs at 03:00 UTC):
     - Checkout (SHA pinned).
     - Install Node 22 + pnpm (pinned).
     - Run collectors: detector health (with Supabase creds), workflow harmony, cache health, bench buffer quick check.
     - Persist outputs → `.aegis_audit/harmony-daily.jsonl` (append).
     - Render dashboard + badges.
     - Commit artifacts to `harmony/nightly` branch or push to main if allowed.
2. **Escalation Hooks**
   - If `HARMONY_SCORE < 99.9`, open issue `integrity-harmony-drop` (reopen if existing).
   - Post Slack/webhook summary with top gaps.

### Phase 3C — Real-time Drift Watchers
1. **Push-time Monitor**
   - Add job to Integrity workflow computing delta between current `vars.json` and last known good (store baseline under `.aegis_audit/baseline.json`).
   - Fail if any metric drops > 0.5 % without accompanying `ACK_HARMONY_DRIFT=true`.
2. **PR Commenter**
   - After each run, post sticky comment summarizing Integrity vs Harmony trajectory:
     ```
     Integrity: 99.99% (PASS)
     Harmony: 99.93% (PASS, -0.02 vs baseline)
     Follow-ups: WF_PERM + cache refresh scheduled.
     ```

### Phase 3D — Sustainment Tooling
1. **Badge Integration**
   - Publish harmony badge into README badges row.
   - Expose JSON endpoint via GitHub Pages or artifact for external monitors.
2. **Runbook Updates**
   - Add Harmony section to `RELEASE-CHECKLIST.md`:
     - Verify nightly Harmony job green for ≥ 3 days.
     - Ensure detector health coverage weight ≥ 0.95.
3. **SLO Dashboard**
   - Extend dashboard renderer to add trend sparkline using `harmony-daily.jsonl`.
   - Provide 7-day moving average and highlight outages.

## Collector Contract
Every Harmony collector must:
- Emit JSON: `{ code, pct, status, note, timestamp }`.
- Default missing metrics to WARN with clear `note`.
- Avoid network calls without tokens; fail gracefully with WARN 0.
- Append to `.aegis_audit/harmony-daily.jsonl` with newline-delimited JSON (one per run).

## Alerting & Escalation Matrix
| Condition | Action | Ownership |
| --- | --- | --- |
| Harmony < 99.9% (once) | Create/Update `integrity-harmony-drop` issue; assign release owner | Release captain |
| Harmony < 99.9% (3 runs) | Auto-block merges (`workflow_run` guard), DM core channel | Ops lead |
| Detector health coverage < 95% | Pager escalation to ML team | Detector squad |
| Workflow hygiene WARN > 0 | Autoblock release tags | Release engineer |

## Validation Checklist
- [ ] Harmony collector outputs present in `.aegis_audit/vars.json`.
- [ ] `.aegis_audit/harmony-daily.jsonl` updated within last 24 h.
- [ ] README shows Harmony badge with ≥ 99.9 %.
- [ ] Nightly workflow logs accessible and retained ≥ 14 days.
- [ ] Escalation issue template populated and linked in docs.

## Implementation Sequence
1. Upgrade collectors & Integrity workflow (Week 1).
2. Add nightly Harmony workflow + dashboard enhancements (Week 2).
3. Integrate badges, alerting, and drift guard (Week 3).
4. Run 7-day soak; record variance; refine thresholds (Week 4).

## Maintainer Notes
- Rotate Action SHAs quarterly (see pinning workflow).
- Keep Harmonic weights documented in `scripts/release/aegis-final-audit-variables.json`.
- Archive old `harmony-daily.jsonl` entries monthly (move to `archives/`).
- Review SLO compliance in monthly Governance review.

## Completion Gate
- Harmony workflow green for 7 consecutive nights.
- Integrity + Harmony dashboards show ≥ 99.99 % / ≥ 99.9 %.
- Alerting automation validated via game-day.
- Documentation signed off by release captain and ops lead.
