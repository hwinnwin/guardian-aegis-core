import { foldBasic, emojiHints } from './normalize';

const DEFAULT_DIM = 4096;

function hash(value: string, dim: number): number {
  let n = 2166136261 >>> 0;
  for (let i = 0; i < value.length; i += 1) {
    n ^= value.charCodeAt(i);
    n = (n * 16777619) >>> 0;
  }
  return n % dim;
}

export interface FeaturizeOpts {
  dim?: number;
  useBigrams?: boolean;
  useTrigrams?: boolean;
  kw?: string[];
}

export function featurize(raw: string, opts: FeaturizeOpts = {}) {
  const dim = opts.dim ?? DEFAULT_DIM;
  const norm = foldBasic(emojiHints(raw ?? ''));
  const map = new Map<number, number>();
  const useB = opts.useBigrams !== false;
  const useT = opts.useTrigrams !== false;

  for (let i = 0; i < norm.length; i += 1) {
    if (useB && i + 1 < norm.length) {
      const g2 = norm.slice(i, i + 2);
      const id = hash(`g2:${g2}`, dim);
      map.set(id, (map.get(id) ?? 0) + 1);
    }
    if (useT && i + 2 < norm.length) {
      const g3 = norm.slice(i, i + 3);
      const id = hash(`g3:${g3}`, dim);
      map.set(id, (map.get(id) ?? 0) + 1);
    }
  }

  for (const kw of opts.kw ?? []) {
    if (!kw) continue;
    if (norm.includes(kw)) {
      const id = hash(`kw:${kw}`, dim);
      map.set(id, (map.get(id) ?? 0) + 2);
    }
  }

  const ids = Array.from(map.keys());
  const vals = ids.map((id) => map.get(id)!);
  const l2 = Math.sqrt(vals.reduce((acc, v) => acc + v * v, 0)) || 1;
  const normalized = vals.map((v) => v / l2);

  return {
    ids,
    vals: normalized,
    normText: norm,
  };
}
