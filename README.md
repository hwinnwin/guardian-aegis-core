[![Changelog Bot](https://img.shields.io/badge/Changelog%20Bot-auto--merge-0e8a16)](https://github.com/hwinnwin/guardian-aegis-core/actions/workflows/auto-merge-changelog.yml)

[![Buffer Bench & Validate](https://github.com/hwinnwin/guardian-aegis-core/actions/workflows/bench-buffer.yml/badge.svg)](https://github.com/hwinnwin/guardian-aegis-core/actions/workflows/bench-buffer.yml)

# Lumen Guardian — Beta Build

Light for safety. Privacy by design.

Lumen Guardian is a privacy-first safety layer for families. The browser extension monitors conversations locally, blocks grooming attempts in real time, and lets parents review sealed evidence with a PIN. All analytics, training data, and telemetry stay on the device—no cloud required.

## Monorepo layout

```
guardian-aegis-core-main/
├── packages/
│   ├── extension/   # MV3 browser extension (beta)
│   ├── dashboard/   # QA + parent dashboard SPA
│   ├── buffer/      # High-performance rolling buffer library
│   └── detector/    # Future detection engine package (placeholder)
├── assets/          # Store-ready icons, screenshots, hero artwork
├── docs/            # Alpha testing guide & release notes
└── PRIVACY.md / SECURITY.md / SAFEGUARDS.md
```

## Getting started

```bash
pnpm install

# Run package tests
pnpm -w test
# Or individually
pnpm -F @lumen-guardian/extension test
pnpm -F @lumen-guardian/dashboard test
```

To build the extension:

```bash
pnpm -F @lumen-guardian/extension build
pnpm -F @lumen-guardian/extension zip  # produces lumen-guardian-extension.zip
```

Load `packages/extension/dist` as an unpacked extension in Chrome for local development.

## Calibration & QA workflow

1. Toggle shadow mode (`localStorage.guardian_shadow = "1"`) to compare fast-path rules with the layer-1 classifier.
2. Use the dashboard QA page to inspect:
   - Analytics panel (detections, shadow agreement, lockouts)
   - Rule simulator & inspector (severity, notes, false-positive hints)
   - Trainer panel to capture appeals and retrain the classifier
   - Tuner panel to adjust thresholds using live shadow stats
   - Corpus runner for quick FP/FN sweeps across sample text
3. Export updated models/thresholds via the trainer or tuner and verify them with the smoke checklist in `RELEASE-CHECKLIST.md`.

## Release checklist (beta)

- `pnpm -w test`
- `pnpm -F @lumen-guardian/extension build && pnpm -F @lumen-guardian/extension zip`
- QA page smoke: Analytics, Simulator, Trainer, Tuner, Corpus Runner, Rule Inspector, Docs links
- Manual Chrome smoke: block → alert → PIN unlock; recovery reset + nuke reset
- Optional: enable shadow mode and inspect classifier agreement
- Confirm MV3 service worker stays healthy (chrome://extensions)

More detailed guidance lives in `docs/ALPHA.md`.

## Support & documentation

- [Privacy Promise](./PRIVACY.md)
- [Security Overview](./SECURITY.md)
- [Safeguards & parental controls](./SAFEGUARDS.md)
- [Alpha testing notes](./docs/ALPHA.md)

For feedback or partnership enquiries, reach out at **hello@lumenguardian.app**.

