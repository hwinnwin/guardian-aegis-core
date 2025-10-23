#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const CHECK = args.includes("--check");
const WORKFLOWS_DIR = ".github/workflows";

const ensureGh = () => {
  try {
    execSync("gh --version", { stdio: "ignore" });
  } catch {
    console.error("GitHub CLI (gh) is required but not available in PATH.");
    process.exit(1);
  }
};

const listWorkflowFiles = () => {
  if (!fs.existsSync(WORKFLOWS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(WORKFLOWS_DIR)
    .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
    .map((file) => path.join(WORKFLOWS_DIR, file));
};

const resolveSha = (owner, repo, ref, location) => {
  try {
    const result = execSync(
      `gh api repos/${owner}/${repo}/commits/${ref} -q .sha`,
      { stdio: ["ignore", "pipe", "pipe"] },
    )
      .toString()
      .trim();
    if (/^[0-9a-f]{40}$/i.test(result)) {
      return result;
    }
    console.warn(
      `⚠️  ${location}: resolved value '${result}' is not a 40-char SHA (owner=${owner}, repo=${repo}, ref=${ref}).`,
    );
    return null;
  } catch (error) {
    console.warn(
      `⚠️  ${location}: unable to resolve ${owner}/${repo}@${ref} (${error?.message || error}).`,
    );
    return null;
  }
};

const files = listWorkflowFiles();
if (!files.length) {
  console.log("No workflow files found under .github/workflows.");
  process.exit(0);
}

ensureGh();

let totalChanges = 0;
const modifications = [];

files.forEach((filePath) => {
  const original = fs.readFileSync(filePath, "utf8");
  let changed = false;

  const rewritten = original.replace(
    /(uses:\s*)([\w.-]+)\/([\w.-]+)@([^\s#]+)(.*)/g,
    (match, prefix, owner, repo, ref, suffix) => {
      if (/^[0-9a-f]{40}$/i.test(ref)) {
        return match;
      }
      const location = `${filePath}`;
      const sha = resolveSha(owner, repo, ref, location);
      if (!sha) {
        return match;
      }
      changed = true;
      totalChanges += 1;
      modifications.push({
        file: filePath,
        owner,
        repo,
        ref,
        sha,
      });
      return `${prefix}${owner}/${repo}@${sha}${suffix}`;
    },
  );

  if (WRITE && changed) {
    fs.writeFileSync(filePath, rewritten);
  }
});

if (!totalChanges) {
  console.log("No action references required pinning.");
  process.exit(0);
}

modifications.forEach((item) => {
  console.log(
    `→ ${item.file}: ${item.owner}/${item.repo}@${item.ref}  ==>  ${item.sha}`,
  );
});

if (WRITE) {
  console.log(`Pinned ${totalChanges} action reference(s).`);
  process.exit(0);
}

console.log(`Would pin ${totalChanges} action reference(s).`);
if (CHECK) {
  process.exit(1);
}
console.log("Dry-run complete. Re-run with --write to apply changes.");
