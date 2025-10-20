# Lumen Guardian Beta Release Checklist

## Build & automated tests
- [ ] Update version in `packages/extension/manifest.json`
- [ ] `pnpm -w test`
- [ ] `pnpm -F @lumen-guardian/extension build` and `pnpm -F @lumen-guardian/extension zip`

## Manual QA
- [ ] Load unpacked extension from `packages/extension/dist` in Chrome
- [ ] Smoke: block → alert → parent PIN unlock
- [ ] Recovery: generate code, reset PIN, verify old PIN fails
- [ ] Run **Nuke Reset** and confirm all local data clears
- [ ] QA page smoke (Analytics, Simulator, Trainer, Tuner, Corpus Runner, Rule Inspector, Docs links)
- [ ] Optional: enable shadow mode and confirm agreement counters update
- [ ] Watch `chrome://extensions` → Service Worker for crashes or excessive restarts

## Packaging & documentation
- [ ] Ensure `assets/icons`, `assets/screens`, and `assets/hero` contain up-to-date assets
- [ ] Verify `PRIVACY.md`, `SECURITY.md`, `SAFEGUARDS.md`, and `docs/ALPHA.md` match the build
- [ ] Host permissions limited to listed chat domains; note any additions in release notes and obtain user consent before expanding
- [ ] Update release notes with analytics snapshot + known limitations
- [ ] Tag release in git and update CHANGELOG
