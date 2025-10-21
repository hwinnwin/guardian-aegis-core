# AI QC Safety Protocol — Changelog Auto Merge

- Machine user: **`ai-qc-bot`** (configured in workflow env)
- Every changelog-only PR must include an approval from this machine user before auto-merge.
- Set `REQUIRE_MACHINE_USER=false` to disable temporarily (or approve manually).
- Missing machine-user approval makes the workflow fail with provenance error.
