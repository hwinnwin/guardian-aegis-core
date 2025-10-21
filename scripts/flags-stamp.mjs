import fs from "node:fs";
const channel = process.env.DEPLOY_CHANNEL || "beta";
const src = `config/feature-flags.${channel}.json`;
const flags = fs.existsSync(src) ? JSON.parse(fs.readFileSync(src, "utf8")) : {};
fs.writeFileSync("feature-flags.json", JSON.stringify(flags, null, 2));
console.log(`🔧 Feature flags stamped from ${src}`);
