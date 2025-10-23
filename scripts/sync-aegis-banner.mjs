import fs from "node:fs";
import { execSync } from "node:child_process";

function resolveRepoSlug() {
  const envSlug = process.env.GITHUB_REPOSITORY;
  if (envSlug && envSlug.includes("/")) return envSlug;
  try {
    const remote = execSync("git config --get remote.origin.url", { encoding: "utf8" }).trim();
    return remote
      .replace(/^.*github\.com[:/]/, "")
      .replace(/\.git$/, "");
  } catch {
    return "";
  }
}

function readVersion() {
  const files = ["docs/AI_QC_AUDIT.md", "docs/AI_QC_WORKFLOW.md"];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const contents = fs.readFileSync(file, "utf8");
    const match = contents.match(/AI[-_ ]QC Safety Protocol.*v?(\d+\.\d+)/i);
    if (match) return match[1];
  }
  return "3.1+";
}

function getStatusColor(repoSlug) {
  if (!repoSlug) {
    return { color: "lightgrey", emoji: "⚪" };
  }
  try {
    const output = execSync(`gh api repos/${repoSlug}/commits/main/status`, { encoding: "utf8" });
    const data = JSON.parse(output);
    if (data.state === "success") return { color: "0e8a16", emoji: "🟢" };
    if (data.state === "pending") return { color: "dbab09", emoji: "🟡" };
    return { color: "b60205", emoji: "🔴" };
  } catch {
    return { color: "lightgrey", emoji: "⚪" };
  }
}

function buildBanner(version, emoji, color) {
  const badgeVersion = version.replace(/\+/g, "%2B");
  const badge = `![AI-QC Safety Protocol](https://img.shields.io/badge/AI--QC_Safety_Protocol-v${badgeVersion}-${color}?style=for-the-badge&logo=github)`;
  return `<div align="center">

# ${emoji} Guardian Aegis Protocol  
**Protected by AI-QC Safety Protocol v${version}**  
_Autonomous CI/CD • Provenance • Compliance Integrity_

${badge}

</div>`;
}

function syncBanner() {
  const marker = "<!-- AEGIS_BANNER -->";
  const repoSlug = resolveRepoSlug();
  const version = readVersion();
  const { color, emoji } = getStatusColor(repoSlug);
  const banner = buildBanner(version, emoji, color);
  const block = `${marker}\n${banner}\n${marker}`;

  const readmePath = "README.md";
  const existing = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, "utf8") : "";

  const updated = existing.includes(marker)
    ? existing.replace(new RegExp(`${marker}[\\s\\S]*?${marker}`), block)
    : `${block}\n\n${existing.trim()}\n`;

  fs.writeFileSync(readmePath, updated);
  console.log(`✅ Aegis banner synced to v${version} (${emoji})`);
}

syncBanner();
