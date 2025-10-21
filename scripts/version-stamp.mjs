import { execSync } from "node:child_process";
import fs from "node:fs";
const version = process.env.APP_VERSION ?? "0.0.0-beta.local";
const commit = execSync("git rev-parse --short HEAD").toString().trim();
const build_time = new Date().toISOString();
fs.writeFileSync(
  "version.json",
  JSON.stringify({ version, commit, build_time }, null, 2)
);
console.log(`📦 Version stamped: ${version} (${commit})`);
