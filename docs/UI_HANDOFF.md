# UI Hand-Off (Dashboard + Extension)

## Scope
- **Dashboard (@lumen-guardian/dashboard)**: Beta surface for parents/QA
- **Extension (@lumen-guardian/extension)**: MV3, limited permissions, beta branding

## Required before beta freeze
- [ ] Embed **version + commit** in UI: read `version.json` and render in footer/about modal
- [ ] Respect **feature flags** (`feature-flags.json`) for beta-only toggles
- [ ] Show **“Beta” badge** in navbar and Extension action popup
- [ ] Add **Consent & Telemetry** toggle (default ON for beta, can be disabled)
- [ ] Error toasts: actionable with copyable **error code + SHA**
- [ ] Empty states + loading skeletons on main views

## Accessibility & UX
- [ ] Keyboard nav & focus ring on all primary actions
- [ ] High-contrast theme works; respects OS dark mode
- [ ] Tooltips/labels for new/advanced controls

## Tech Notes
- **Flags**: inject at build (file: `feature-flags.json`) and load at runtime
- **Version**: `version.json` stamped by CI (version, commit, build_time)
- **Guardrails**: no `eval`, no dynamic host perms; MV3 service worker CSP clean
