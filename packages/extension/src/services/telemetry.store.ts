import { snapshot, recordShadowEval } from '../detection/metrics';
import type { AdvisoryLevel } from '../detection/decide';

const KEY = 'guardian_metrics';

export function publishMetrics() {
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot()));
    window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
  } catch (err) {
    console.warn('[Lumen Guardian] Failed to publish metrics', err);
  }
}

export function pushShadowEval(entry: {
  level: AdvisoryLevel;
  fastPath: AdvisoryLevel;
  prob: number;
  ts: number;
  textLen: number;
}) {
  try {
    recordShadowEval(entry.level, entry.fastPath, entry.prob, entry.textLen, entry.ts);
    publishMetrics();
  } catch (err) {
    console.warn('[Lumen Guardian] Failed to log shadow eval', err);
  }
}
