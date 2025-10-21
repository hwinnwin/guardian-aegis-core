# Beta Launch Checklist

## 0) Branch & Version
- [ ] Branch cut: `release/beta-v1`
- [ ] Tag: `v1.0.0-beta.1`
- [ ] `version.json` present and surfaced in UI

## 1) CI/CD
- [ ] Bench & validator passing (mem/op, p95, RSS) with artifacts and SHA
- [ ] UI Quality workflow (lint, typecheck, tests) green
- [ ] CD workflows present and secrets configured (see CD_OVERVIEW.md)
- [ ] **Beta deploy (dashboard + extension) completed** with SHA verified

## 2) Security & Privacy
- [ ] Extension MV3 permissions minimal; manifest reviewed
- [ ] CSP enforced; no unsafe eval/dynamic code
- [ ] PRIVACY.md & SECURITY.md reflect telemetry + hashing

## 3) Product Readiness
- [ ] Flags set for beta (`config/feature-flags.beta.json`)
- [ ] Empty states & error toasts verified
- [ ] Onboarding/consent path works; opt-out documented

## 4) Feedback & Support
- [ ] Issue templates in place (Beta Bug, Beta Feedback)
- [ ] Label taxonomy: `beta`, `bug`, `ux`, `perf`, `security`
- [ ] Tracking issue opened (Beta Rollout)

## Go / No-Go
- [ ] All required checks are green
- [ ] At least 2 maintainers approved
- [ ] Rollback plan tested (cd-rollback workflow)
