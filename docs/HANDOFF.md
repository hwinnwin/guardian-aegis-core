# Lumen Guardian — Beta Handoff

Light for safety. Privacy by design.

## What was fixed
- React 18.3.1 locked across the workspace via overrides/resolutions.
- @lumen-guardian/dashboard now depends directly on react/react-dom.
- Vite/Vitest alias and dedupe for react, react-dom, and JSX runtimes.
- TypeScript configured for automatic JSX runtime (react-jsx).
- pnpm reinstall + cache clears ensure a single React runtime.

## Doctor (guard)
```bash
pnpm doctor:react
```
- Lists installed react/react-dom versions (workspace-wide).
- Resolves react/jsx-dev-runtime from the dashboard package to catch splits early.

## Tests
```bash
pnpm test:all
# or
pnpm -F @lumen-guardian/dashboard test
pnpm -F @lumen-guardian/extension test
```

## Build & Zip (MV3)
```bash
pnpm build:ext
pnpm zip:ext
```
Artifacts:
- packages/extension/dist/  (load unpacked in Chrome)
- packages/extension/lumen-guardian-extension.zip (uploadable)

## Manual Smoke (Phase 5)
1. Load unpacked extension → confirm onboarding banner.
2. Set Parent PIN → record the recovery code.
3. Trigger a detection → verify block overlay + alert in dashboard → unlock & view MATCH badges (context blurred elsewhere).
4. Run recovery reset → set new PIN → unlock again.
5. Optional: set `localStorage.guardian_shadow = "1"` to view shadow metrics in the QA page.

## If anything fails
- `pnpm -r list react react-dom` to confirm versions.
- `require.resolve('react/jsx-dev-runtime',{ paths: ['packages/dashboard'] })` must resolve.
- Re-check Vite alias & tsconfig JSX runtime configuration.
