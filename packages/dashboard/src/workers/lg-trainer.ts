import { featurize } from '../../../extension/src/detection/featurize';
import type { LGModel } from '../../../extension/src/types/classifier';

export interface TrainSample {
  text: string;
  label: 0 | 1;
}

export interface TrainConfig {
  dim: number;
  lr: number;
  l2: number;
  epochs: number;
  kw: string[];
}

export function train(samples: TrainSample[], cfg: TrainConfig): LGModel {
  const weights = new Float32Array(cfg.dim);
  let bias = 0;

  function step(text: string, label: number) {
    const { ids, vals } = featurize(text, { dim: cfg.dim, kw: cfg.kw });
    let logit = bias;
    for (let i = 0; i < ids.length; i += 1) {
      logit += weights[ids[i]] * vals[i];
    }
    const prob = 1 / (1 + Math.exp(-logit));
    const err = prob - label;
    bias -= cfg.lr * err;
    for (let i = 0; i < ids.length; i += 1) {
      const j = ids[i];
      const grad = err * vals[i] + cfg.l2 * weights[j];
      weights[j] -= cfg.lr * grad;
    }
  }

  for (let epoch = 0; epoch < cfg.epochs; epoch += 1) {
    for (const sample of samples) {
      step(sample.text, sample.label);
    }
  }

  return {
    version: 1,
    dim: cfg.dim,
    bias,
    weights,
    createdAt: Date.now(),
    thresholds: { high: 0.88, medium: 0.7 },
  };
}
