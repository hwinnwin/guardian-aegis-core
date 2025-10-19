import { describe, it, expect } from 'vitest';
import { shouldSuppress } from '../detection/cooldown';

describe('cooldown behavior', () => {
  it('suppresses duplicates for same sender/label within window', () => {
    const now = Date.now();
    const first = shouldSuppress(now, 20_000, 'u1', 'secrecy_isolation', 'HIGH');
    const second = shouldSuppress(now + 1_000, 20_000, 'u1', 'secrecy_isolation', 'HIGH');

    expect(first).toBe(false);
    expect(second).toBe(true);
  });
});
