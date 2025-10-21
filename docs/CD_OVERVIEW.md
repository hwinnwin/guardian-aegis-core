# Continuous Deployment (CD) — Guardian

Two deploy channels:
- **beta** — auto-deploy for testers (no approval)
- **production** — manual approval required before release

All deploys are **SHA-verified** and **build-reproducible**.

## Required Secrets
### Dashboard (Vercel)
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID_BETA`
- `VERCEL_PROJECT_ID_PROD`

### Chrome Web Store (MV3)
- `CWS_CLIENT_ID`
- `CWS_CLIENT_SECRET`
- `CWS_REFRESH_TOKEN`
- `CWS_EXTENSION_ID_BETA`
- `CWS_EXTENSION_ID_PROD`

Environments are configured in **Settings → Environments**:
- `beta` — automatic deploys.
- `production` — requires approval.

Each deploy verifies SHA-256 integrity of its artifact before release.
