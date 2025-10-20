import fs from 'node:fs';
import path from 'node:path';

const benchPath = process.argv[2] ?? 'bench-buffer.json';
const raw = fs.readFileSync(benchPath, 'utf8');
const records = raw
  .trim()
  .split('\n')
  .map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  })
  .filter(Boolean);

const summary =
  [...records].reverse().find((record) => record.type === 'summary') ?? records.at(-1);

if (!summary) {
  console.error('No JSON summary found');
  process.exit(2);
}

const { throughputPerSec, latency = {}, memory = {}, rssPeakMB } = summary.metrics ?? summary;

const loadConfig = () => {
  const candidates = [
    path.resolve('packages/buffer/.benchrc.json'),
    path.resolve('.benchrc.json'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        return JSON.parse(fs.readFileSync(candidate, 'utf8'));
      } catch {
        // ignore parse errors and continue to next candidate
      }
    }
  }
  return {};
};

const config = loadConfig();
const getThreshold = (envKey, cfgKey, fallback) => {
  const envVal = process.env[envKey];
  if (envVal !== undefined && envVal !== '') {
    return Number(envVal);
  }
  const cfgVal = config[cfgKey];
  if (typeof cfgVal === 'number') {
    return Number(cfgVal);
  }
  return fallback;
};

const limits = {
  throughputMin: getThreshold('BENCH_THR_MIN', 'throughputMin', 10000),
  p95MaxMs: getThreshold('BENCH_P95_MAX_MS', 'p95MaxMs', 5),
  memPerInteractionMaxB: getThreshold('BENCH_MEM_PER_OP_MAX', 'memPerInteractionMaxB', 256),
  rssPeakMaxMB: getThreshold('BENCH_RSS_MAX_MB', 'rssPeakMaxMB', 256),
};

console.log('\n📊 Benchmark Summary');
console.log(`├─ Throughput: ${throughputPerSec ?? 'n/a'} ops/s`);
console.log(`├─ p95 Latency: ${latency.p95Ms ?? 'n/a'} ms`);
console.log(`├─ Memory/op: ${memory.bytesPerInteraction ?? 'n/a'} B`);
console.log(`└─ Peak RSS: ${rssPeakMB ?? 'n/a'} MB\n`);

const warnings = [];

if (throughputPerSec !== undefined && throughputPerSec < limits.throughputMin) {
  warnings.push(`Throughput < ${limits.throughputMin}`);
}
if (latency.p95Ms !== undefined && latency.p95Ms > limits.p95MaxMs) {
  warnings.push(`p95 > ${limits.p95MaxMs}ms`);
}
if (
  memory.bytesPerInteraction !== undefined &&
  memory.bytesPerInteraction > limits.memPerInteractionMaxB
) {
  warnings.push(`Mem/op > ${limits.memPerInteractionMaxB}B`);
}
if (rssPeakMB !== undefined && rssPeakMB > limits.rssPeakMaxMB) {
  warnings.push(`RSS > ${limits.rssPeakMaxMB}MB`);
}

if (warnings.length) {
  console.warn(`⚠️  ${warnings.join(' | ')}`);
  process.exitCode = 1;
} else {
  console.log('✅ Metrics within expected range.');
}
