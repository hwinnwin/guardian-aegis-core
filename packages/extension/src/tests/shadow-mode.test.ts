import { describe, it, beforeEach, expect, vi } from 'vitest';

vi.mock('../core/lockdown.css', () => ({}), { virtual: true });

describe('shadow mode logging', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear?.();
  });

  it('records shadow evaluations when enabled', async () => {
    localStorage.setItem('guardian_shadow', '1');
    const telemetry = await import('../services/telemetry.store');
    const pushSpy = vi.spyOn(telemetry, 'pushShadowEval');
    const { onIncomingMessage } = await import('../core/bootstrap');

    onIncomingMessage("let's switch to telegram", Date.now());
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(pushSpy).toHaveBeenCalled();
    const payload = pushSpy.mock.calls[0][0];
    expect(payload.fastPath === 'HIGH' || payload.fastPath === 'CRITICAL').toBe(true);
    expect(typeof payload.prob).toBe('number');
  });
});
