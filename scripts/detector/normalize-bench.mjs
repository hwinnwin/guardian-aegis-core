import fs from "node:fs";

const candidates = [
  "packages/detector/bench/profile.json",
  "bench/profile.json"
];

let found = "";
for (const path of candidates) {
  if (fs.existsSync(path)) {
    found = path;
    break;
  }
}

let ratio = 0;
if (found) {
  try {
    const raw = JSON.parse(fs.readFileSync(found, "utf8"));
    if (
      typeof raw.trials_passed === "number" &&
      typeof raw.trials_total === "number" &&
      raw.trials_total > 0
    ) {
      ratio = (raw.trials_passed / raw.trials_total) * 100;
    } else if (typeof raw.p95_ms === "number" && typeof raw.gate_ms === "number") {
      ratio = raw.p95_ms <= raw.gate_ms ? 100 : 0;
    } else if (typeof raw.pass === "boolean") {
      ratio = raw.pass ? 100 : 0;
    }
  } catch (error) {
    console.warn("Unable to parse bench profile:", error);
  }
}

ratio = Math.max(0, Math.min(100, Number.isFinite(ratio) ? ratio : 0));

const result = {
  deterministic_ratio: ratio,
  source: found || null
};

fs.mkdirSync("artifacts", { recursive: true });
fs.writeFileSync("artifacts/bench.json", JSON.stringify(result, null, 2));
console.log(`Bench deterministic ratio ${ratio} -> artifacts/bench.json`);
