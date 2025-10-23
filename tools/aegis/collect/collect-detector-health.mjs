#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const AUDIT_DIR = '.aegis_audit';
const VARS_PATH = path.join(AUDIT_DIR, 'vars.json');
const TESTS_PATH = path.join(AUDIT_DIR, 'detector-tests.json');
const BENCH_PATH = path.join(AUDIT_DIR, 'detector-bench.json');

const timestamp = new Date().toISOString();

const loadJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    console.warn(`⚠️  Unable to read ${file}:`, error instanceof Error ? error.message : error);
    return null;
  }
};

const tests = loadJson(TESTS_PATH);
const bench = loadJson(BENCH_PATH);

fs.mkdirSync(AUDIT_DIR, { recursive: true });

let passRate = 0;
if (tests && typeof tests === 'object') {
  const passed = Number(tests.numPassedTests ?? tests.passed ?? 0);
  const total = Number(tests.numTotalTests ?? tests.total ?? 0) || 0;
  passRate = total > 0 ? (passed / total) * 100 : 0;
}

let perfScore = 0;
let p95 = 0;
let slo = 0;
if (bench && typeof bench === 'object') {
  p95 = Number(bench.p95 ?? 0);
  slo = Number(bench.slo ?? 0);
  if (slo > 0) {
    if (p95 <= slo) {
      perfScore = 100;
    } else {
      const margin = ((slo - p95) / slo) * 100;
      perfScore = Math.max(0, Math.min(100, Math.round(margin)));
    }
  }
}

const health = Math.max(
  0,
  Math.min(100, Math.round(0.6 * passRate + 0.4 * perfScore)),
);

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

const status = health >= 95 ? 'PASS' : health >= 90 ? 'WARN' : 'FAIL';

vars.DETECT_HEALTH = {
  code: 'DETECT_HEALTH',
  pct: health,
  status,
  note: `Tests ${(passRate || 0).toFixed(1)}% pass • bench p95=${p95.toFixed(2)}ms slo=${slo}ms`,
  timestamp,
};

fs.writeFileSync(VARS_PATH, JSON.stringify(vars, null, 2));
console.log('DETECT_HEALTH', health);

if (!tests || !bench) {
  process.exit(1);
}
