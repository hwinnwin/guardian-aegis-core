#!/usr/bin/env node
/**
 * Guardian Aegis Integrity Scorer (v3.1-PROD)
 * - Reads a schema describing weighted variables and PASS/ADVISORY thresholds
 * - Accepts variable values either from a JSON file (--vars) or environment
 * - Emits SCORE=<pct> and VERDICT=PASS|ADVISORY|FAIL (stdout)
 * - Writes a human-readable log to stderr and .aegis_audit/integrity_score_<timestamp>.log
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argMap = new Map();
for (let i = 0; i < args.length; i++) {
  const token = args[i];
  if (token.startsWith("--")) {
    const key = token.slice(2);
    const value = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "";
    argMap.set(key, value);
  }
}

const schemaPath = argMap.get("schema") || "scripts/release/aegis-final-audit-variables.json";
const varsPath = argMap.get("vars") || "";

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    console.error(`❌ Unable to read JSON file: ${file}\n   ${error}`);
    process.exit(2);
  }
}

const schema = readJson(schemaPath);
const passBar = Number(schema.pass_threshold_pct ?? 99.99);
const advisoryMin = Number(schema.advisory_min_pct ?? 99.9);
const variables = schema.variables ?? [];

if (!Array.isArray(variables) || variables.length === 0) {
  console.error("❌ Schema contains no variables");
  process.exit(2);
}

const weightSum = variables.reduce((sum, v) => sum + Number(v.weight ?? 0), 0);
if (Math.abs(weightSum - 1) > 1e-6) {
  console.error(`❌ Variable weights must sum to 1.0, found ${weightSum}`);
  process.exit(2);
}

const providedValues = varsPath ? readJson(varsPath) : {};
const values = {};
const warnings = [];

for (const entry of variables) {
  const code = entry.code;
  if (!code) continue;
  let raw = providedValues[code];
  if (raw == null && process.env[code] != null) {
    raw = process.env[code];
  }
  let numeric = Number(raw);
  if (raw == null || Number.isNaN(numeric)) {
    numeric = 0;
    warnings.push(`Missing ${code}, defaulting to 0`);
  }
  if (numeric < 0) numeric = 0;
  if (numeric > 100) numeric = 100;
  values[code] = numeric;
}

let integrityScore = 0;
for (const entry of variables) {
  const code = entry.code;
  const weight = Number(entry.weight ?? 0);
  const val = Number(values[code] ?? 0);
  integrityScore += val * weight;
}

const verdict = integrityScore >= passBar ? "PASS" : integrityScore >= advisoryMin ? "ADVISORY" : "FAIL";

console.log(`SCORE=${integrityScore.toFixed(4)}`);
console.log(`VERDICT=${verdict}`);

const summary = [];
summary.push(`Guardian Aegis Integrity Score ${schema.version ?? "(unknown)"}`);
summary.push(`Score: ${integrityScore.toFixed(4)}% → ${verdict}`);
summary.push("");
summary.push("Components:");

for (const entry of variables) {
  const code = entry.code;
  const val = (values[code] ?? 0).toFixed(3).padStart(7, " ");
  const weightPct = ((Number(entry.weight ?? 0)) * 100).toFixed(2).padStart(6, " ");
  summary.push(
    ` - ${code.padEnd(14)} ${val}% · w=${weightPct}% · target>=${Number(entry.target_pct ?? 0)}% · ${entry.desc ?? ""}`
  );
}

if (warnings.length) {
  summary.push("");
  summary.push("Warnings:");
  for (const warning of warnings) summary.push(` - ${warning}`);
}

const outputText = summary.join("\n");
console.error(outputText);

const logDir = ".aegis_audit";
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, `integrity_score_${new Date().toISOString().replace(/[:.]/g, "-")}.log`);
fs.writeFileSync(logFile, `${outputText}\n`);
console.error(`\nWrote ${logFile}`);
