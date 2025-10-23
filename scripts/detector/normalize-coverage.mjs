import fs from "node:fs";

const candidates = [
  "coverage/detector/coverage-summary.json",
  "packages/detector/coverage/coverage-summary.json"
];

let found = "";
for (const path of candidates) {
  if (fs.existsSync(path)) {
    found = path;
    break;
  }
}

if (!found) {
  console.warn("No coverage-summary.json found; defaulting to 0%");
  process.exit(0);
}

const raw = JSON.parse(fs.readFileSync(found, "utf8"));
const total = raw.total ?? {};
const pct =
  typeof total.lines?.pct === "number"
    ? total.lines.pct
    : typeof total.line?.pct === "number"
    ? total.line.pct
    : 0;
const linePct = Math.max(0, Math.min(100, Number(pct) || 0));

const result = {
  total: { line: { pct: linePct } },
  source: found
};

fs.mkdirSync("artifacts", { recursive: true });
fs.writeFileSync("artifacts/coverage-summary.json", JSON.stringify(result, null, 2));
console.log(`Coverage summary normalized (${linePct}%) -> artifacts/coverage-summary.json`);
