import fs from 'node:fs';
const channel = process.env.DEPLOY_CHANNEL || 'beta';
const src = channel === 'production'
  ? 'config/feature-flags.prod.json'
  : 'config/feature-flags.beta.json';
const flags = JSON.parse(fs.readFileSync(src,'utf8'));
fs.writeFileSync('feature-flags.json', JSON.stringify(flags,null,2)+'\n');
console.log(`🔧 Feature flags stamped from ${src}`);
