import fs from 'node:fs';
import { execSync } from 'node:child_process';

const sha = execSync('git rev-parse --short HEAD').toString().trim();
const now = new Date().toISOString();
const version = process.env.APP_VERSION ?? '0.0.0-beta.local';

fs.writeFileSync(
  'version.json',
  JSON.stringify({ version, commit: sha, build_time: now }, null, 2) + '\n'
);

console.log(`📦 Version stamped: ${version} (${sha}) at ${now}`);
