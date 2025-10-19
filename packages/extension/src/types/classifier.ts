export interface LGFeatures {
  ids: Uint32Array;
  vals: Float32Array;
}

export interface LGModel {
  version: 1;
  dim: number;
  bias: number;
  weights: Float32Array;
  createdAt: number;
  thresholds: {
    high: number;
    medium: number;
  };
}

export interface LGScore {
  logit: number;
  prob: number;
}
