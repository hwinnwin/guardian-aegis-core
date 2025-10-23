#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();

const metaPath = path.resolve(
  cwd,
  process.env.AEGIS_VARIABLES_PATH ??
    "scripts/release/aegis-final-audit-variables.json",
);
if (!fs.existsSync(metaPath)) {
  console.error(
    `Aegis variable metadata missing at ${metaPath}. Set AEGIS_VARIABLES_PATH if stored elsewhere.`,
  );
  process.exit(1);
}

const varsPath = path.resolve(
  cwd,
  process.argv[2] ?? ".aegis_audit/vars.json",
);
const outPath = path.resolve(
  cwd,
  process.argv[3] ?? "docs/aegis-integrity-phase2-dashboard.md",
);

const parseJson = (filePath, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    if (fallback !== undefined) {
      return fallback;
    }
    console.error(`Failed to read ${filePath}: ${error.message || error}`);
    process.exit(1);
  }
};

const meta = parseJson(metaPath, {});
const definitions = Array.isArray(meta?.variables) ? meta.variables : [];
let variables = {};

if (fs.existsSync(varsPath)) {
  const parsed = parseJson(varsPath, {});
  if (Array.isArray(parsed)) {
    variables = Object.fromEntries(parsed.map((item) => [item.code, item]));
  } else if (parsed?.variables && Array.isArray(parsed.variables)) {
    variables = Object.fromEntries(
      parsed.variables.map((item) => [item.code, item]),
    );
  } else if (parsed && typeof parsed === "object") {
    variables = parsed;
  }
}

const normalizePct = (input) => {
  const value = Number(input);
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, value));
};

const resolveStatus = (entry, target) => {
  const raw = entry?.status ? String(entry.status).toUpperCase() : "";
  if (["PASS", "WARN", "FAIL"].includes(raw)) return raw;
  const pct = normalizePct(entry?.pct ?? entry?.value ?? entry?.score);
  if (pct === null) return "WARN";
  if (pct >= target) return "PASS";
  if (pct <= 0) return "WARN";
  return "FAIL";
};

const formatPct = (value) => {
  if (value === null) return "n/a";
  return `${value.toFixed(2)}%`;
};

const statusIcon = {
  PASS: "✅",
  WARN: "⚠️",
  FAIL: "❌",
};

const checklistMark = {
  PASS: "x",
  WARN: " ",
  FAIL: " ",
};

const auditDir = path.resolve(cwd, ".aegis_audit");

const findLatestAudit = () => {
  if (!fs.existsSync(auditDir)) return null;
  const files = fs
    .readdirSync(auditDir)
    .filter(
      (name) => name.startsWith("final_audit_") && name.endsWith(".log"),
    )
    .sort()
    .reverse();
  if (!files.length) return null;
  const name = files[0];
  const content = fs.readFileSync(path.join(auditDir, name), "utf8");
  const scoreMatch = content.match(/SCORE:\s*([0-9.]+)%/i);
  const passMatch = content.match(/PASS:\s*([0-9]+)/i);
  const warnMatch = content.match(/WARN:\s*([0-9]+)/i);
  const failMatch = content.match(/FAIL:\s*([0-9]+)/i);
  return {
    name,
    content: content.trim(),
    score: scoreMatch ? Number(scoreMatch[1]) : null,
    pass: passMatch ? Number(passMatch[1]) : null,
    warn: warnMatch ? Number(warnMatch[1]) : null,
    fail: failMatch ? Number(failMatch[1]) : null,
  };
};

const latestAudit = findLatestAudit();

let weightedSum = 0;
let totalWeight = 0;
const rows = definitions.map((definition) => {
  const code = definition.code;
  const entry = variables[code] ?? {};
  const pct = normalizePct(entry?.pct ?? entry?.value ?? entry?.score);
  const target = normalizePct(definition.target_pct) ?? 0;
  const weight = Number(definition.weight ?? 0);
  const status = resolveStatus(entry, target);
  totalWeight += weight;
  const contribution = pct !== null ? (pct / 100) * weight : 0;
  weightedSum += contribution;
  return {
    code,
    desc: definition.desc ?? code,
    target,
    pct,
    status,
    weight,
    source: definition.source ?? "",
    note:
      entry?.note ??
      entry?.notes ??
      (Object.keys(entry).length
        ? ""
        : "Metric missing; defaulting to 0 per audit spec."),
  };
});

const integrityScore =
  totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;

const now = new Date().toISOString();
const lines = [];

lines.push("# Aegis Integrity Dashboard — Phase 2");
lines.push(`_Auto-generated ${now}_`);
lines.push("");

lines.push("## Overview");
lines.push(
  `- Integrity Score (computed): **${integrityScore.toFixed(2)}%** · Target ≥ ${
    meta.pass_threshold_pct ?? "99.99"
  }% · Advisory ≥ ${meta.advisory_min_pct ?? "99.90"}%`,
);
if (latestAudit) {
  lines.push(
    `- Latest log: \`${latestAudit.name}\` → Score ${latestAudit.score ?? "n/a"}% · PASS ${latestAudit.pass ?? "n/a"} · WARN ${latestAudit.warn ?? "n/a"} · FAIL ${latestAudit.fail ?? "n/a"}`,
  );
} else {
  lines.push("- Latest log: _none detected in `.aegis_audit/`_");
}
lines.push(
  "- Variables sourced from `scripts/release/aegis-final-audit-variables.json`.",
);
lines.push("");

lines.push("## Variable Checklist");
lines.push(
  "| Status | Code | Target | Actual | Weight | Source | Notes |",
);
lines.push("| --- | --- | --- | --- | --- | --- | --- |");
rows.forEach((row) => {
  lines.push(
    `| ${statusIcon[row.status] ?? "?"} | \`${row.code}\` | ${formatPct(row.target)} | ${formatPct(row.pct)} | ${(row.weight * 100).toFixed(1)}% | ${row.source || "—"} | ${row.note || "—"} |`,
  );
});
lines.push("");

lines.push("## Action Items");
rows.forEach((row) => {
  lines.push(
    `- [${checklistMark[row.status] ?? " "}] ${row.code} — ${row.desc} · Target ${formatPct(row.target)} · Actual ${formatPct(row.pct)} (${row.status})`,
  );
});
lines.push("");

if (latestAudit?.content) {
  lines.push("## Latest Audit Log Snippet");
  lines.push("```text");
  lines.push(latestAudit.content);
  lines.push("```");
  lines.push("");
}

lines.push("## Notes");
lines.push(
  "- Regenerate this dashboard via `node tools/aegis/report/render-dashboard.mjs [.aegis_audit/vars.json] [docs/aegis-integrity-phase2-dashboard.md]` after each audit run.",
);
lines.push(
  "- Ensure `.aegis_audit/vars.json` captures `{ code, pct, status, note }` entries for every variable.",
);
lines.push("");

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join("\n"));
console.log(`Dashboard written to ${outPath}`);
