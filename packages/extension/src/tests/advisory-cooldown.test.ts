import { describe, it, expect, beforeEach } from 'vitest';
import { shouldSuppress } from '../detection/cooldown';

describe('advisory cooldown', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear?.();
  });

  it('suppresses duplicate advisory actions within cooldown window', () => {
    const now = Date.now();
    const first = shouldSuppress(now, 20_000, 'user-123', 'pii_request', 'MEDIUM');
    expect(first).toBe(false);

    const suppressed = shouldSuppress(now + 1_000, 20_000, 'user-123', 'pii_request', 'MEDIUM');
    expect(suppressed).toBe(true);

    const afterWindow = shouldSuppress(now + 25_000, 20_000, 'user-123', 'pii_request', 'MEDIUM');
    expect(afterWindow).toBe(false);
  });
});
