import { describe, it, expect, beforeEach } from 'vitest';
import { shouldSuppress } from '../detection/cooldown';

describe('cooldown session storage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('persist state per tab via sessionStorage', () => {
    const now = 1000;
    const first = shouldSuppress(now, 20_000, 'u1', 'label', 'HIGH');
    expect(first).toBe(false);

    const suppressed = shouldSuppress(now + 1_000, 20_000, 'u1', 'label', 'HIGH');
    expect(suppressed).toBe(true);

    sessionStorage.clear();

    const afterClear = shouldSuppress(now + 2_000, 20_000, 'u1', 'label', 'HIGH');
    expect(afterClear).toBe(false);
  });
});
