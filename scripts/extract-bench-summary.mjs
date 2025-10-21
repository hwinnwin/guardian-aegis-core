import fs from "node:fs";
const f = process.argv[2] ?? "bench-buffer.json";
if (!fs.existsSync(f)) process.exit(2);
const recs = fs.readFileSync(f, "utf8").trim().split("\n")
  .map(l => { try { return JSON.parse(l); } catch { return null; } })
  .filter(Boolean);
const s = [...recs].reverse().find(r => r.type === "summary") ?? recs.at(-1);
const m = s?.metrics ?? {};
const env = {
  BENCH_THR: m.throughputPerSec ?? "",
  BENCH_P95_MS: m.latency?.p95Ms ?? "",
  BENCH_MEM_B: m.memory?.bytesPerInteraction ?? "",
  BENCH_RSS_MB: m.rssPeakMB ?? ""
};
fs.writeFileSync("bench-summary.env", Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n"));
console.log("✅ Bench summary extracted", env);
