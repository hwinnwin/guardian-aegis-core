import { describe, it, expect, beforeEach } from 'vitest';
import { metrics, snapshot, reset, inc } from '../detection/metrics';

describe('metrics counters', () => {
  beforeEach(() => {
    reset();
  });

  it('increments counters and snapshots state', () => {
    inc('detections');
    inc('blocks');
    inc('critical');
    const snap = snapshot();
    expect(snap.detections).toBe(1);
    expect(snap.blocks).toBe(1);
    expect(snap.critical).toBe(1);
    expect(snap.advisories).toBe(0);
    expect(snap.appeals).toBe(0);
    expect(snap.ttb.samples).toBe(0);
    expect(typeof snap.ts).toBe('number');
  });
});
