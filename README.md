# Lumyn Guardian Aegis

**Privacy-first child safety for the modern web**

Lumyn Guardian Aegis is a browser-based safety layer that protects children from online predators while respecting family privacy. The extension runs 100% locally—no cloud processing, no data collection, no tracking. Real-time detection blocks grooming attempts before they escalate, while parents maintain oversight through PIN-protected evidence review.

## Project Status

**Current Stage:** Alpha Development
**Architecture:** Monorepo with MV3 browser extension + QA dashboard
**Detection Engine:** Hybrid rules + ML classifier with shadow mode validation
**Privacy Model:** Zero cloud dependencies—all processing, analytics, and training data stay on device

## Key Features

- **Real-time Protection**: Multi-layer detection blocks grooming patterns instantly
- **Local-First Architecture**: Zero telemetry, zero cloud processing, zero data exfiltration
- **Evidence Preservation**: Tamper-proof sealed evidence with PIN-protected parent review
- **Shadow Mode**: Compare rule-based and ML detections for calibration without impacting users
- **QA Dashboard**: Analytics, rule simulation, model training, threshold tuning, and corpus testing
- **Privacy by Design**: Parents can't spy—only review blocked interactions sealed at detection time

## Architecture Overview

**Detection Pipeline:**
1. **Fast Path (Rules)**: Pattern matching for known grooming indicators (severity scoring)
2. **Layer-1 Classifier**: ML model for nuanced detection (shadow mode for calibration)
3. **Evidence Sealing**: Cryptographic sealing at detection time—immutable until PIN unlock
4. **Rolling Buffer**: High-performance circular buffer for conversation context (configurable retention)

**Privacy Guarantees:**
- All ML inference runs in-browser (TensorFlow.js or ONNX Runtime)
- No network requests for detection or analytics
- Model training data never leaves the device
- Parents can only access pre-sealed evidence, not live conversations

## Monorepo Layout

```
guardian-aegis-core/
├── packages/
│   ├── extension/   # MV3 browser extension (alpha) - content scripts, background worker
│   ├── dashboard/   # QA + parent dashboard SPA - analytics, training, tuning UI
│   ├── buffer/      # High-performance rolling buffer library
│   └── detector/    # Detection engine package (rules + ML classifier)
├── assets/          # Store-ready icons, screenshots, hero artwork
├── docs/            # Alpha testing guide, release notes, architecture diagrams
└── PRIVACY.md / SECURITY.md / SAFEGUARDS.md  # Policy & compliance documentation
```

## Getting started

```bash
pnpm install

# Run package tests
pnpm -w test
# Or individually
pnpm -F @guardian/extension test
pnpm -F @guardian/dashboard test
```

To build the extension:

```bash
pnpm -F @guardian/extension build
pnpm -F @guardian/extension zip  # produces guardian-extension.zip
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

## Development Roadmap

**Current (Alpha Phase):**
- ✅ Core detection engine (rules + ML classifier)
- ✅ Browser extension (MV3 architecture)
- ✅ QA dashboard with analytics and tuning tools
- ✅ Evidence sealing and PIN-protected review
- ✅ Shadow mode for calibration
- 🔄 Active testing and threshold calibration

**Near-term (Beta Preparation):**
- Multi-platform support (Firefox, Safari)
- Enhanced parent dashboard with reporting
- Model optimization for reduced memory footprint
- Expanded rule corpus and classifier training
- User onboarding flow and documentation

**Future Considerations:**
- Multi-language support
- Accessibility enhancements
- Platform-specific social media integrations
- Community rule contributions (privacy-preserving)

## Release Checklist (Alpha)

**Pre-build validation:**
- `pnpm -w test` - Run all package tests
- `pnpm -F @guardian/extension build && pnpm -F @guardian/extension zip`

**QA Dashboard smoke tests:**
- Analytics panel: Verify detection counts, shadow agreement, lockout stats
- Rule simulator & inspector: Test severity scoring, review notes, check FP hints
- Trainer panel: Capture appeals, retrain classifier, export updated models
- Tuner panel: Adjust thresholds using live shadow stats
- Corpus runner: Execute FP/FN sweeps across sample text

**Manual Chrome testing:**
- Block → alert → PIN unlock flow
- Recovery reset + nuke reset functionality
- Shadow mode: Enable and verify classifier agreement metrics
- MV3 service worker health check (chrome://extensions)

**Documentation verification:**
- Smoke test all docs links from QA dashboard
- Verify `RELEASE-CHECKLIST.md` completeness

More detailed guidance lives in `docs/ALPHA.md`.

## Technology Stack

**Extension:**
- Manifest V3 (Chrome, future: Firefox/Safari)
- TypeScript for type safety
- Content scripts + background service worker architecture

**Detection Engine:**
- TensorFlow.js / ONNX Runtime for in-browser ML inference
- Custom rule engine with severity scoring
- High-performance rolling buffer for conversation context

**Dashboard:**
- Modern SPA framework (React/Vue/Svelte - TBD based on codebase)
- Local storage for analytics (IndexedDB)
- No server dependencies—fully client-side

**Build & Testing:**
- pnpm workspaces for monorepo management
- TypeScript compilation
- Unit and integration test suites

## Contributing & Security

**For Researchers & Contributors:**
This is an alpha-stage child safety project. We welcome security researchers, privacy advocates, and developers interested in privacy-preserving safety tech.

**Security Disclosure:**
If you discover a security vulnerability, please report it responsibly. Contact **security@lumenguardian.app** with details. We take all reports seriously and will respond promptly.

**Important Note:**
IP addresses, API keys, and network configuration files are excluded from this repository. See `.gitignore` for protected patterns.

## Documentation & Support

**Core Documentation:**
- [Privacy Promise](./PRIVACY.md) - Our commitment to zero data collection
- [Security Overview](./SECURITY.md) - Threat model and security architecture
- [Safeguards & Parental Controls](./SAFEGUARDS.md) - How parents maintain oversight
- [Alpha Testing Notes](./docs/ALPHA.md) - Detailed testing and calibration guide

**Contact:**
- General feedback: **hello@lumenguardian.app**
- Security issues: **security@lumenguardian.app**
- Partnership inquiries: **hello@lumenguardian.app**

---

**Built with privacy, transparency, and child safety as core principles.**
