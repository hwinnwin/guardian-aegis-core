#!/usr/bin/env node
/**
 * Minimal detector bench harness.
 * Emits:
 *  - .aegis_audit/detector-bench.json
 *  - .aegis_audit/bench-summary.json
 */
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const auditDir = path.join(repoRoot, ".aegis_audit");

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const cleaned = arg.replace(/^--/, "");
    const [key, value] = cleaned.split("=");
    return [key, value ?? true];
  }),
);

const warmup = Number(args.warmup ?? process.env.WARMUP ?? 5);
const runs = Number(args.runs ?? process.env.RUNS ?? 30);
const slo = Number(process.env.DETECTOR_SLO_MS ?? 60);

function quantile(sorted, q) {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sorted[base + 1] ?? sorted[base];
  return sorted[base] + (next - sorted[base]) * rest;
}

async function workload() {
  // TODO: swap with real detector classification workload.
  const ms = 40 + Math.random() * 5;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function runOnce() {
  const start = performance.now();
  await workload();
  return performance.now() - start;
}

(async () => {
  fs.mkdirSync(auditDir, { recursive: true });

  for (let i = 0; i < warmup; i += 1) {
    await runOnce();
  }

  const samples = [];
  for (let i = 0; i < runs; i += 1) {
    samples.push(await runOnce());
  }

  samples.sort((a, b) => a - b);
  const p50 = Math.round(quantile(samples, 0.5) * 100) / 100;
  const p95 = Math.round(quantile(samples, 0.95) * 100) / 100;

  const payload = {
    p50,
    p95,
    slo,
    runs,
    warmup,
  };

  fs.writeFileSync(
    path.join(auditDir, "detector-bench.json"),
    JSON.stringify(payload, null, 2),
  );
  fs.writeFileSync(
    path.join(auditDir, "bench-summary.json"),
    JSON.stringify({ p95, slo }, null, 2),
  );

  console.log(JSON.stringify(payload));
})();
