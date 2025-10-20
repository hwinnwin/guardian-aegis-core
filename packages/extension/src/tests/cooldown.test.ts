import { describe, it, expect } from 'vitest';
import { shouldSuppress } from '../detection/cooldown';

describe('cooldown', () => {
  it('suppresses repeat alerts within the window', () => {
    const now = 1_000_000;
    const windowMs = 20_000;

    const first = shouldSuppress(now, windowMs, 'u1', 'move_off_platform_invite', 'HIGH');
    expect(first).toBe(false);

    const suppressed = shouldSuppress(now + 5_000, windowMs, 'u1', 'move_off_platform_invite', 'HIGH');
    expect(suppressed).toBe(true);

    const allowed = shouldSuppress(now + 25_000, windowMs, 'u1', 'move_off_platform_invite', 'HIGH');
    expect(allowed).toBe(false);
  });
});
