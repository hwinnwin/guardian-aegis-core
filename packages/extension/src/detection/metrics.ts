type AdvisoryLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ShadowEvalRecord {
  ts: number;
  level: AdvisoryLevel;
  fastPath: AdvisoryLevel;
  prob: number;
  textLen: number;
}

export const metrics = {
  detections: 0,
  blocks: 0,
  critical: 0,
  advisories: 0,
  appeals: 0,
  rulesCompileErrors: 0,
  shadowTotal: 0,
  shadowHigh: 0,
  shadowMedium: 0,
  shadowAgree: 0,
  shadowHighNoFast: 0,
  shadowFastHigher: 0,
  shadowProbabilities: [] as number[],
  shadowHistory: [] as ShadowEvalRecord[],
  ttbMs: [] as number[],
};

export function inc(metric: 'detections' | 'blocks' | 'critical' | 'advisories' | 'appeals') {
  metrics[metric] += 1;
}

export function addTTB(ms: number) {
  if (!Number.isFinite(ms)) return;
  metrics.ttbMs.push(ms);
  if (metrics.ttbMs.length > 200) metrics.ttbMs.shift();
}

export function reset() {
  metrics.detections = 0;
  metrics.blocks = 0;
  metrics.critical = 0;
  metrics.advisories = 0;
  metrics.appeals = 0;
  metrics.rulesCompileErrors = 0;
  metrics.shadowTotal = 0;
  metrics.shadowHigh = 0;
  metrics.shadowMedium = 0;
  metrics.shadowAgree = 0;
  metrics.shadowHighNoFast = 0;
  metrics.shadowFastHigher = 0;
  metrics.shadowProbabilities = [];
  metrics.shadowHistory = [];
  metrics.ttbMs = [];
}

function trackShadowHistory(entry: ShadowEvalRecord) {
  metrics.shadowHistory.push(entry);
  if (metrics.shadowHistory.length > 50) {
    metrics.shadowHistory.shift();
  }
}

export function recordShadowEval(level: AdvisoryLevel, fastPathLevel: AdvisoryLevel, prob: number, textLen: number, ts: number) {
  metrics.shadowTotal += 1;
  if (level === 'HIGH') metrics.shadowHigh += 1;
  if (level === 'MEDIUM') metrics.shadowMedium += 1;
  if (level === fastPathLevel) metrics.shadowAgree += 1;
  if (level === 'HIGH' && fastPathLevel !== 'HIGH' && fastPathLevel !== 'CRITICAL') {
    metrics.shadowHighNoFast += 1;
  }
  if ((fastPathLevel === 'HIGH' || fastPathLevel === 'CRITICAL') && level !== 'HIGH') {
    metrics.shadowFastHigher += 1;
  }
  if (Number.isFinite(prob)) {
    metrics.shadowProbabilities.push(prob);
    if (metrics.shadowProbabilities.length > 200) {
      metrics.shadowProbabilities.shift();
    }
  }
  trackShadowHistory({ ts, level, fastPath: fastPathLevel, prob, textLen });
}

export function recordRuleCompileError() {
  metrics.rulesCompileErrors += 1;
}

function percentile(arr: number[], p: number) {
  if (!arr.length) return 0;
  const a = arr.slice().sort((x, y) => x - y);
  const idx = Math.floor((p / 100) * (a.length - 1));
  return a[idx];
}

export function snapshot() {
  const shadowProbs = metrics.shadowProbabilities;
  const probAvg =
    shadowProbs.length > 0
      ? shadowProbs.reduce((acc, val) => acc + val, 0) / shadowProbs.length
      : 0;

  return {
    detections: metrics.detections,
    blocks: metrics.blocks,
    critical: metrics.critical,
    advisories: metrics.advisories,
    appeals: metrics.appeals,
    rulesCompileErrors: metrics.rulesCompileErrors,
    shadow: {
      total: metrics.shadowTotal,
      high: metrics.shadowHigh,
      medium: metrics.shadowMedium,
      agree: metrics.shadowAgree,
      highNoFast: metrics.shadowHighNoFast,
      fastPathHigher: metrics.shadowFastHigher,
      prob: {
        avg: probAvg,
        p50: percentile(shadowProbs, 50),
        p95: percentile(shadowProbs, 95),
        samples: shadowProbs.length,
      },
      history: metrics.shadowHistory.slice(-20),
    },
    ttb: {
      p50: percentile(metrics.ttbMs, 50),
      p95: percentile(metrics.ttbMs, 95),
      samples: metrics.ttbMs.length,
    },
    ts: Date.now(),
  };
}
