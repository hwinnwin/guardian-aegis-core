#!/usr/bin/env node
import fs from 'node:fs';

const AUDIT_DIR = '.aegis_audit';
const LOG_PATH = `${AUDIT_DIR}/pnpm-cache.log`;
const VARS_PATH = `${AUDIT_DIR}/vars.json`;

fs.mkdirSync(AUDIT_DIR, { recursive: true });

let warm = 0;
let cold = 0;

if (fs.existsSync(LOG_PATH)) {
  try {
    const log = fs.readFileSync(LOG_PATH, 'utf8');
    const warmMatch = log.match(/warm_hits=(\d+)/);
    const coldMatch = log.match(/cold_misses=(\d+)/);
    warm = warmMatch ? Number(warmMatch[1]) : 0;
    cold = coldMatch ? Number(coldMatch[1]) : 0;
  } catch (error) {
    console.warn(`⚠️  Unable to read ${LOG_PATH}:`, error instanceof Error ? error.message : error);
  }
} else {
  console.warn(`⚠️  Cache telemetry not found at ${LOG_PATH}.`);
}

const total = warm + cold;
const pct = total > 0 ? Math.round((warm / total) * 10000) / 100 : 0;
const status = (() => {
  if (pct >= 95) return 'PASS';
  if (pct >= 90) return 'WARN';
  return 'FAIL';
})();

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

const entry = {
  code: 'CACHE_HEALTH',
  pct,
  status,
  note: total > 0 ? `warm=${warm} cold=${cold}` : 'No cache telemetry captured.',
  timestamp: new Date().toISOString(),
};

vars.CACHE_HEALTH = entry;
fs.writeFileSync(VARS_PATH, JSON.stringify(vars, null, 2));
console.log('CACHE_HEALTH', pct.toFixed(2));
