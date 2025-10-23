#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const AUDIT_DIR = '.aegis_audit';
const VARS_PATH = path.join(AUDIT_DIR, 'vars.json');
const SUMMARY_PATH = path.join(AUDIT_DIR, 'bench-summary.json');

fs.mkdirSync(AUDIT_DIR, { recursive: true });

let vars = {};
if (fs.existsSync(VARS_PATH)) {
  try {
    const parsed = JSON.parse(fs.readFileSync(VARS_PATH, 'utf8'));
    if (Array.isArray(parsed)) {
      vars = Object.fromEntries(parsed.map((entry) => [entry.code, entry]));
    } else if (parsed && typeof parsed === 'object') {
      vars = parsed;
    }
  } catch (error) {
    console.warn(`⚠️  Unable to parse ${VARS_PATH}:`, error instanceof Error ? error.message : error);
  }
}

let p95 = 0;
let slo = 0;
if (fs.existsSync(SUMMARY_PATH)) {
  try {
    const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf8'));
    p95 = Number(summary.p95 ?? 0);
    slo = Number(summary.slo ?? 0);
  } catch (error) {
    console.warn(`⚠️  Unable to read ${SUMMARY_PATH}:`, error instanceof Error ? error.message : error);
  }
} else {
  console.warn(`⚠️  Bench summary not found at ${SUMMARY_PATH}`);
}

let bufferScore = 0;
if (slo > 0 && p95 >= 0) {
  if (p95 <= slo) {
    bufferScore = 100;
  } else {
    bufferScore = Math.max(0, Math.min(100, Math.round(((slo - p95) / slo) * 100)));
  }
}

const status = bufferScore >= 95 ? 'PASS' : bufferScore >= 90 ? 'WARN' : 'FAIL';

vars.BENCH_BUFFER = {
  code: 'BENCH_BUFFER',
  pct: bufferScore,
  status,
  note: slo ? `p95=${p95.toFixed(2)}ms vs slo=${slo}ms` : 'Bench SLO not provided.',
  timestamp: new Date().toISOString(),
};

fs.writeFileSync(VARS_PATH, JSON.stringify(vars, null, 2));
console.log('BENCH_BUFFER', bufferScore);

if (!fs.existsSync(SUMMARY_PATH)) {
  process.exit(1);
}
