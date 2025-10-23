#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const NO_FAIL = process.argv.includes('--no-fail');

const AUDIT_DIR = '.aegis_audit';
const VARS_PATH = path.join(AUDIT_DIR, 'vars.json');
const REPORT_PATH = path.join(AUDIT_DIR, 'pkg_pin_report.txt');

const roots = ['packages', 'apps', 'services']
  .map((dir) => path.resolve(dir))
  .filter((dir) => fs.existsSync(dir));

const offenders = [];

const scanPackageJson = (filePath) => {
  try {
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
      const deps = json[section] || {};
      for (const [name, range] of Object.entries(deps)) {
        if (typeof range !== 'string') continue;
        if (!range.startsWith('workspace:')) continue;
        const spec = range.slice('workspace:'.length);
        if (/^[~^*><=]|x|\|\|/.test(spec)) {
          offenders.push(`${filePath}:${section}:${name}@${range}`);
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️  Unable to read ${filePath}:`, error instanceof Error ? error.message : error);
  }
};

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile() && entry.name === 'package.json') {
      scanPackageJson(full);
    }
  }
};

roots.forEach((root) => walk(root));

fs.mkdirSync(AUDIT_DIR, { recursive: true });
fs.writeFileSync(REPORT_PATH, offenders.join('\n'));

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

const pct = offenders.length ? 70 : 100;
const status = pct >= 100 ? 'PASS' : 'FAIL';

vars.PKG_PIN = {
  code: 'PKG_PIN',
  pct,
  status,
  note: offenders.length
    ? `Loose ranges detected (${offenders.length}); see pkg_pin_report.txt.`
    : 'All workspace dependencies pinned (no ^/~/* ranges).',
  timestamp: new Date().toISOString(),
};

fs.writeFileSync(VARS_PATH, JSON.stringify(vars, null, 2));
console.log('PKG_PIN', pct, 'offenders', offenders.length);

if (offenders.length && !NO_FAIL) {
  process.exit(1);
}

process.exit(0);
