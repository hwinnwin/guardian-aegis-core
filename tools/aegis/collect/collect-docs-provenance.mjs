#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const AUDIT_DIR = '.aegis_audit';
const VARS_PATH = path.join(AUDIT_DIR, 'vars.json');
fs.mkdirSync(AUDIT_DIR, { recursive: true });

const timestamp = new Date().toISOString();

const requiredDocs = [
  'docs/AI_QC_WORKFLOW.md',
  'docs/aegis-integrity-phase2.md',
  'docs/aegis-harmony-phase3.md',
  'docs/ALPHA.md',
  'docs/BETA_CHECKLIST.md',
  'README.md',
  'SAFEGUARDS.md',
  'SECURITY.md',
  'PRIVACY.md'
];

const optionalDocs = [
  'docs/aegis-integrity-phase2-dashboard.md',
  'docs/CD_OVERVIEW.md',
  'docs/UI_HANDOFF.md',
  'docs/RELEASE_NOTES_TEMPLATE.md',
  'docs/HANDOFF.md'
];

const ensureExists = (file) => fs.existsSync(path.resolve(file));
const requiredPresent = requiredDocs.filter(ensureExists);
const optionalPresent = optionalDocs.filter(ensureExists);

const docAuditPct = Math.round((requiredPresent.length / requiredDocs.length) * 10000) / 100;

const readFileText = (file) => {
  try {
    return fs.readFileSync(path.resolve(file), 'utf8');
  } catch {
    return '';
  }
};

const coverageChecks = requiredPresent.map((file) => {
  const text = readFileText(file);
  const hasHeadline = /^#\s+/m.test(text);
  const hasSections = /^##\s+/m.test(text);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const hasSufficientWords = wordCount >= 200 || hasSections;
  const hasLinks = /\[[^\]]+\]\([^\)]+\)/.test(text);
  let score = 0;
  if (hasHeadline) score += 0.4;
  if (hasSufficientWords) score += 0.4;
  if (hasLinks) score += 0.2;
  return score;
});

const avgCoverage = coverageChecks.length
  ? coverageChecks.reduce((sum, value) => sum + value, 0) / coverageChecks.length
  : 0;

const optionalBoost = optionalPresent.length ? Math.min(optionalPresent.length * 4, 15) : 0;
const srcDocPct = Math.round(Math.min(avgCoverage * 100 + optionalBoost, 100));

const provenanceArtifacts = [
  'dist/seed.txt',
  '.aegis_audit/pnpm-cache.log',
  'docs/aegis-harmony-phase3.md'
];
const provenancePresent = provenanceArtifacts.filter(ensureExists);
const provCovPct = Math.round((provenancePresent.length / provenanceArtifacts.length) * 10000) / 100;
const cdConfidencePct = Math.min(provCovPct, docAuditPct);

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

const statusFor = (pct, pass) => {
  if (pct >= pass) return 'PASS';
  if (pct >= Math.max(pass - 10, 0)) return 'WARN';
  return 'FAIL';
};

const upsert = (code, pct, passThreshold, note) => {
  vars[code] = {
    code,
    pct,
    status: statusFor(pct, passThreshold),
    note,
    timestamp,
  };
};

upsert(
  'DOC_AUDIT',
  Math.min(docAuditPct, 100),
  90,
  `Docs present: ${requiredPresent.length}/${requiredDocs.length}`,
);

upsert(
  'SRC_DOC',
  Math.min(Math.max(srcDocPct, 0), 100),
  90,
  `Documentation quality checks on ${requiredPresent.length} files (optional present: ${optionalPresent.length}).`,
);

upsert(
  'PROV_COV',
  Math.min(provCovPct, 100),
  90,
  `Provenance artifacts present: ${provenancePresent.length}/${provenanceArtifacts.length}.`,
);

upsert(
  'CD_CONF',
  Math.min(cdConfidencePct, 100),
  90,
  'CD confidence limited by provenance coverage and doc audit readiness.',
);

fs.writeFileSync(VARS_PATH, JSON.stringify(vars, null, 2));
console.log('DOC_AUDIT', vars.DOC_AUDIT.pct.toFixed(2));
console.log('SRC_DOC', vars.SRC_DOC.pct.toFixed(2));
console.log('PROV_COV', vars.PROV_COV.pct.toFixed(2));
console.log('CD_CONF', vars.CD_CONF.pct.toFixed(2));
