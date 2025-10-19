import { describe, it, expect, beforeEach } from 'vitest';
import { setModel } from '../detection/classifier';
import { classifyAdvisory } from '../detection/decide';

describe('classifier inference', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('scores risky text above threshold', () => {
    const dim = 32;
    const weights = new Float32Array(dim);
    weights.fill(0);
    // force high probability via bias
    const model = {
      version: 1 as const,
      dim,
      bias: 3,
      weights,
      createdAt: Date.now(),
      thresholds: { high: 0.8, medium: 0.6 },
    };
    setModel(model);
    const level = classifyAdvisory("let's switch to telegram", model, ['telegram']);
    expect(level === 'HIGH' || level === 'MEDIUM').toBe(true);
  });
});
