import { scoreHeuristics } from "./heuristics.js";
import type { DetectorConfig, AnalyzeInput, AnalyzeResult } from "./types";

let CONFIG: DetectorConfig = { threshold: 0.7, maxWindowMs: 5 * 60_000 };

export function configure(cfg: Partial<DetectorConfig>): void {
  CONFIG = { ...CONFIG, ...cfg };
}

export function analyze(input: AnalyzeInput): AnalyzeResult {
  const ts = typeof input.ts === "number" ? input.ts : Date.now();
  let text: string;
  if (typeof input.text === "string") {
    text = input.text;
  } else if (input.text == null) {
    text = "";
  } else {
    text = String(input.text);
  }
  const { score, reasons } = scoreHeuristics(text);
  const threshold = CONFIG.threshold ?? 0.7;
  const passed = score < threshold;

  return {
    score,
    passed,
    reasons,
    ts
  };
}

export { scoreHeuristics } from "./heuristics.js";
export type { DetectorConfig, AnalyzeInput, AnalyzeResult } from "./types";
