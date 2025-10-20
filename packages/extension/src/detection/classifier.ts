import type { LGModel, LGScore } from '../types/classifier';
import { featurize } from './featurize';

const MODEL_KEY = 'lg_classifier_model';
let currentModel: LGModel | null = null;

function reviveModel(raw: any): LGModel | null {
  if (!raw) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      version: parsed.version ?? 1,
      dim: parsed.dim,
      bias: parsed.bias,
      weights: new Float32Array(parsed.weights ?? []),
      createdAt: parsed.createdAt ?? Date.now(),
      thresholds: parsed.thresholds ?? { high: 0.9, medium: 0.7 },
    };
  } catch {
    return null;
  }
}

export function loadModelFromStorage(): LGModel | null {
  const raw = localStorage.getItem(MODEL_KEY);
  const model = reviveModel(raw);
  currentModel = model;
  return model;
}

export function setModel(model: LGModel) {
  currentModel = model;
  const json = { ...model, weights: Array.from(model.weights) };
  localStorage.setItem(MODEL_KEY, JSON.stringify(json));
}

export function getModel(): LGModel | null {
  return currentModel ?? loadModelFromStorage();
}

export function infer(text: string, kw: string[] = []): LGScore {
  const model = getModel();
  if (!model || !text) return { logit: 0, prob: 0 };
  const { ids, vals } = featurize(text, { dim: model.dim, kw });
  let logit = model.bias;
  for (let i = 0; i < ids.length; i += 1) {
    logit += model.weights[ids[i]] * vals[i];
  }
  const prob = 1 / (1 + Math.exp(-logit));
  return { logit, prob };
}
