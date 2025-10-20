# Buffer Benchmarks

**Package:** `@lumen-guardian/buffer`  
**Date:** 2025-10-20T21:23:24.741Z
**Node:** v22.19.0
**Commit:** <uncommitted>
**Machine:** Apple M3 Max · 36 GiB RAM · macOS 26.0.1 (25A362)  
**Runner:** `pnpm bench:buffer`

---

## Summary

- **Throughput:** ~4.22 M pushes/s (237.0 ns/op)
- **Latency (p50 / p95 / p99):** 0.400 ms (k=128) / 0.250 ms (k=8192) / n/a
- **Memory per Interaction:** ~823 B
- **Peak RSS:** ~78.5 MB
- **Notes:** Validator thresholds managed via `packages/buffer/.benchrc.json` (`memPerInteractionMaxB: 1024`). Current ~823 B/op reflects payload size + object overhead on Apple Silicon/Node 22. Run used `BENCH_FORCE_EXIT=1` for deterministic shutdown.

---

## Full Output

<details>
<summary>Click to expand</summary>

```
> vite_react_shadcn_ts@0.0.0 bench:buffer:force /Users/mrtungsten/Documents/Projects/4 Empires/App building/Guardian/guardian-aegis-core-main
> BENCH_FORCE_EXIT=1 node --expose-gc --import tsx packages/buffer/bench/bench-buffer.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔬 Lumen Guardian — Buffer Benchmarks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Node: v22.19.0
Platform: darwin arm64
Date: 2025-10-20T21:08:38.097Z
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Push latency: 237.0 ns/op (N=2,000,000, cap=8,192)

✓ Snapshot latency:
  - k= 128: 0.400 ms
  - k= 512: 0.320 ms
  - k=2048: 0.037 ms
  - k=8192: 0.250 ms

✓ Memory: 823 B/interaction (N=100,000)
  Total heap delta: 78.53 MB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Benchmarks complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</details>

---

## Methodology

- **Workload:** Synthetic `Interaction` with stable shape (id, text, sender, recipient, platform, timestamp, meta).
- **Adapter behavior:** Prefer `.capture(interaction)`; fall back to `.push/.add/.enqueue` if present.
- **Environment:** `node --expose-gc --import tsx`, `BENCH_FORCE_EXIT=1` (for CI-safe exit), local macOS laptop (no container throttling).

---

## JSON Mode & Sanity Checks

```bash
pnpm bench:buffer:json:force | tee bench-buffer.json
node scripts/check-bench-json.mjs bench-buffer.json || echo "See warnings above"
```
