#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const AUDIT_DIR = '.aegis_audit';
const VARS_PATH = `${AUDIT_DIR}/vars.json`;
const WORKFLOWS_DIR = '.github/workflows';

fs.mkdirSync(AUDIT_DIR, { recursive: true });

const workflowFiles = fs.existsSync(WORKFLOWS_DIR)
  ? fs
      .readdirSync(WORKFLOWS_DIR)
      .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))
      .map((file) => path.join(WORKFLOWS_DIR, file))
  : [];

const stats = workflowFiles.map((filePath) => {
  const contents = fs.readFileSync(filePath, 'utf8');
  const usesMatches = contents.match(/uses:\s*[^\n]+@([^\s#]+)/g) ?? [];
  const totalUses = usesMatches.length;
  const pinnedUses = usesMatches.filter((line) => /@([0-9a-f]{40})/.test(line)).length;
  const hasPermissions = /permissions\s*:/i.test(contents);
  const hasConcurrency = /concurrency\s*:/i.test(contents);
  return {
    filePath,
    totalUses,
    pinnedUses,
    hasPermissions,
    hasConcurrency,
  };
});

const sum = (key) =>
  stats.reduce((acc, item) => {
    const value = item[key];
    return acc + (typeof value === 'number' ? value : 0);
  }, 0);

const totalUses = sum('totalUses');
const pinnedUses = sum('pinnedUses');
const totalWorkflows = workflowFiles.length || 1;
const workflowsWithPermissions = stats.filter((item) => item.hasPermissions).length;
const workflowsWithConcurrency = stats.filter((item) => item.hasConcurrency).length;

const pct = (value, total) => {
  if (!total) return 0;
  return Math.round((value / total) * 10000) / 100;
};

const wfPinPct = totalUses === 0 ? 100 : pct(pinnedUses, totalUses);
const wfPermPct = pct(workflowsWithPermissions, workflowFiles.length);
const wfConcPct = pct(workflowsWithConcurrency, workflowFiles.length);

const statusFor = (value, passThreshold) => {
  if (value >= passThreshold) return 'PASS';
  if (value >= Math.max(passThreshold - 10, 0)) return 'WARN';
  return 'FAIL';
};

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

const upsert = (code, pctValue, passThreshold, note) => {
  vars[code] = {
    code,
    pct: pctValue,
    status: statusFor(pctValue, passThreshold),
    note,
    timestamp: new Date().toISOString(),
  };
};

upsert(
  'WF_PIN',
  wfPinPct,
  95,
  workflowFiles.length
    ? `Pinned uses: ${pinnedUses}/${totalUses}`
    : 'No workflows found in repository.',
);
upsert(
  'WF_PERM',
  wfPermPct,
  95,
  workflowFiles.length
    ? `Workflows with explicit permissions block: ${workflowsWithPermissions}/${workflowFiles.length}`
    : 'No workflows found in repository.',
);
upsert(
  'WF_CONC',
  wfConcPct,
  90,
  workflowFiles.length
    ? `Workflows with concurrency defined: ${workflowsWithConcurrency}/${workflowFiles.length}`
    : 'No workflows found in repository.',
);

fs.writeFileSync(VARS_PATH, JSON.stringify(vars, null, 2));
console.log('WF_PIN', wfPinPct.toFixed(2));
console.log('WF_PERM', wfPermPct.toFixed(2));
console.log('WF_CONC', wfConcPct.toFixed(2));
