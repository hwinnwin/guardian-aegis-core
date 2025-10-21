/**
 * Generates a Conventional Commits changelog section between the previous tag and:
 *  - the current tag (if GITHUB_REF is a tag) or
 *  - HEAD (otherwise).
 * Prints the section to stdout (no file mutation).
 */
import { execSync } from 'node:child_process';

function sh(cmd) {
  return execSync(cmd, { stdio: ['ignore','pipe','ignore'] }).toString().trim();
}

// Robust loader for conventional-changelog (CJS)
let conventionalChangelog;
try {
  const mod = await import('conventional-changelog');
  conventionalChangelog = mod.default ?? mod;
  if (typeof conventionalChangelog !== 'function') {
    throw new Error('conventional-changelog did not export a function');
  }
} catch (err) {
  console.error('❌ Unable to load "conventional-changelog". Did devDeps install successfully?');
  console.error(String(err?.message ?? err));
  process.exit(1);
}

const ref = process.env.GITHUB_REF || sh('git rev-parse --abbrev-ref HEAD');
const isTagRef = ref.startsWith('refs/tags/');
const currentTag = isTagRef ? ref.replace('refs/tags/', '') : '';
const toRef = currentTag || 'HEAD';

// Find previous tag
let fromRef = '';
try {
  const all = sh("git tag --list --sort=-creatordate 'v*'").split('\n').filter(Boolean);
  if (currentTag) {
    const idx = all.indexOf(currentTag);
    if (idx >= 0 && idx < all.length - 1) fromRef = all[idx + 1];
  } else {
    fromRef = all[1] || '';
  }
} catch {}

const header = `## ${currentTag || 'Unreleased'} (${new Date().toISOString().slice(0,10)})\n`;
const context = {
  version: currentTag || 'Unreleased',
  currentTag: currentTag || null,
  previousTag: fromRef || null,
};

const options = {
  preset: 'conventionalcommits',
  releaseCount: 0,
};

const gitRawCommitsOpts = {
  from: fromRef || undefined,
  to: toRef || undefined,
};

let out = '';
const stream = conventionalChangelog(options, context, gitRawCommitsOpts);
await new Promise((resolve, reject) => {
  stream.on('data', buf => out += buf.toString('utf8'));
  stream.on('error', reject);
  stream.on('end', resolve);
});

if (!out.trim()) {
  console.log(header + '\n_No conventional commits found._\n');
  process.exit(0);
}

console.log(header + out.trim() + '\n');
