import fs from 'node:fs';
import { execSync } from 'node:child_process';

const nodeVer = process.version;
const runDate = new Date().toISOString();
let gitSha = '';

try {
  gitSha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
} catch {
  gitSha = '<uncommitted>';
}

const filePath = 'packages/buffer/BENCHMARKS.md';
const content = fs.readFileSync(filePath, 'utf8');
const updated = content
  .replace(/\*\*Date:\*\* .*/, `**Date:** ${runDate}`)
  .replace(/\*\*Node:\*\* .*/, `**Node:** ${nodeVer}`)
  .replace(/\*\*Commit:\*\* .*/, `**Commit:** ${gitSha}`);

fs.writeFileSync(filePath, updated);
console.log(`✓ Updated: Node ${nodeVer}, Date ${runDate}, Commit ${gitSha}`);

