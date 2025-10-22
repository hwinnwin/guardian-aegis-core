export type DetectorConfig = {
  /**
   * Decision threshold in the 0..1 range. Scores >= threshold are considered risky.
   */
  threshold: number;
  /**
   * Deterministic seed for any stochastic components (reserved for future ML plug-ins).
   */
  seed?: string;
  /**
   * Optional sliding window horizon used by callers to prune stale context.
   */
  maxWindowMs?: number;
};

export type AnalyzeInput = {
  text?: string;
  metadata?: Record<string, unknown>;
  ts?: number;
};

export type AnalyzeResult = {
  score: number;
  passed: boolean;
  reasons: string[];
  ts: number;
};
