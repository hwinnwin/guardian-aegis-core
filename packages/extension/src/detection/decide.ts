import type { LGModel } from '../types/classifier';
import { infer } from './classifier';

export type AdvisoryLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export function classifyAdvisoryWithScore(
  text: string,
  model: LGModel | null,
  kw: string[] = []
): { level: AdvisoryLevel; prob: number } {
  if (!model || !text) return { level: 'NONE', prob: 0 };
  const { prob } = infer(text, kw);
  if (prob >= model.thresholds.high) return { level: 'HIGH', prob };
  if (prob >= model.thresholds.medium) return { level: 'MEDIUM', prob };
  return { level: 'NONE', prob };
}

export function classifyAdvisory(text: string, model: LGModel | null, kw: string[] = []): AdvisoryLevel {
  return classifyAdvisoryWithScore(text, model, kw).level;
}
