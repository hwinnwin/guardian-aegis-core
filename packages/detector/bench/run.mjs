import fs from "node:fs";
import { analyze, configure } from "../dist/index.js";

const SEED = process.env.SEED ?? "det-0001";
const ITER = Number.parseInt(process.env.ITER ?? "200", 10);
const P95_LIMIT_MS = Number.parseFloat(process.env.P95_LIMIT_MS ?? "80");

function nowMs() {
  const [seconds, nanoseconds] = process.hrtime();
  return seconds * 1000 + nanoseconds / 1e6;
}

function sampleText(i) {
  const pool = [
    "Hello, how is your day?",
    "What is your age? Just curious.",
    "Add me on telegram for private chat.",
    "Don't tell anyone about this conversation.",
    "Random conversation about homework for class.",
    "Which city are you in these days?"
  ];
  return pool[(i * 9301 + 49297) % pool.length];
}

configure({ threshold: 0.7, seed: SEED });

const latencies = [];
for (let i = 0; i < ITER; i++) {
  const started = nowMs();
  analyze({ text: sampleText(i), ts: Date.now() });
  const finished = nowMs();
  latencies.push(finished - started);
}

latencies.sort((a, b) => a - b);
const pick = (q) => latencies[Math.max(0, Math.min(latencies.length - 1, Math.floor(q * (latencies.length - 1))))];

const metrics = {
  p50: Number(pick(0.50).toFixed(3)),
  p90: Number(pick(0.90).toFixed(3)),
  p95: Number(pick(0.95).toFixed(3)),
  p99: Number(pick(0.99).toFixed(3))
};

const pass = metrics.p95 <= P95_LIMIT_MS;
const profile = {
  seed: SEED,
  iterations: ITER,
  latencies_ms: metrics,
  p95_ms: metrics.p95,
  gate_ms: P95_LIMIT_MS,
  trials_passed: pass ? ITER : 0,
  trials_total: ITER,
  pass
};

fs.mkdirSync("packages/detector/bench", { recursive: true });
fs.writeFileSync("packages/detector/bench/profile.json", JSON.stringify(profile, null, 2));

console.log(`detector benchmark: p50=${metrics.p50}ms p95=${metrics.p95}ms (limit=${P95_LIMIT_MS}ms) => ${pass ? "PASS" : "FAIL"}`);

if (!pass) {
  process.exitCode = 2;
}
