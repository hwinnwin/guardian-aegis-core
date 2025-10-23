#!/usr/bin/env node
/**
 * Patch .github/workflows/*.yml to add baseline permissions/concurrency blocks.
 */
import fs from 'node:fs';
import path from 'node:path';

const WRITE = process.argv.includes('--write');
const WF_DIR = '.github/workflows';

if (!fs.existsSync(WF_DIR)) {
  console.error('No .github/workflows directory found.');
  process.exit(1);
}

const files = fs.readdirSync(WF_DIR).filter((file) => /\.ya?ml$/i.test(file));
if (!files.length) {
  console.log('No workflow files found.');
  process.exit(0);
}

const PERMISSIONS_BLOCK = ['permissions:', '  contents: read', '  actions: read', '  packages: read', ''];
const CONCURRENCY_BLOCK = ['concurrency:', '  group: ${{ github.workflow }}-${{ github.ref }}', '  cancel-in-progress: false', ''];

let patched = 0;
let skipped = 0;

for (const file of files) {
  const fullPath = path.join(WF_DIR, file);
  const original = fs.readFileSync(fullPath, 'utf8');
  const lines = original.split(/\r?\n/);

  const hasPermissions = /^permissions:\s*$/m.test(original);
  const hasConcurrency = /^concurrency:\s*$/m.test(original);

  if (hasPermissions && hasConcurrency) {
    skipped += 1;
    continue;
  }

  const jobsIndex = lines.findIndex((line) => /^jobs:\s*$/.test(line));
  const insertIndex = jobsIndex === -1 ? lines.length : jobsIndex;

  const toInsert = [];
  if (!hasPermissions) {
    toInsert.push(...PERMISSIONS_BLOCK);
  }
  if (!hasConcurrency) {
    toInsert.push(...CONCURRENCY_BLOCK);
  }

  const updatedLines = [
    ...lines.slice(0, insertIndex),
    ...toInsert,
    ...lines.slice(insertIndex),
  ];

  const updated = updatedLines.join('\n');

  console.log(`→ ${file}:${hasPermissions ? '' : ' +permissions'}${!hasPermissions && !hasConcurrency ? ',' : ''}${hasConcurrency ? '' : ' +concurrency'}`);

  if (WRITE) {
    const backupPath = `${fullPath}.bak`;
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, original);
    }
    fs.writeFileSync(fullPath, updated);
  }

  patched += 1;
}

console.log(
  WRITE
    ? `Patched ${patched} file(s); skipped ${skipped}.`
    : `Dry run: would patch ${patched} file(s); skipped ${skipped}. Re-run with --write to apply.`,
);

process.exit(0);
