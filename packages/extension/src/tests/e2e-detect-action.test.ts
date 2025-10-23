import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionRouter } from '../services/action-router.service';
import { RollingBuffer } from '../../../buffer/src/core/rolling-buffer';
import { EvidenceService } from '../services/evidence.service';
import { loadRules, detectFastPath } from '../detection/engine';
import rulesYaml from '../detection/rules.fast.yaml?raw';
import type { Interaction } from '../../../buffer/src/types';
import type { AlertsSink } from '../services/alerts.service';
import { LockdownService } from '../services/lockdown.service';

async function mockKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

function captureText(buffer: RollingBuffer, text: string) {
  const interaction: Interaction = {
    id: crypto.randomUUID ? crypto.randomUUID() : `msg_${Date.now()}`,
    text,
    sender: { id: 'child', name: 'Child' },
    platform: 'generic',
    timestamp: Date.now(),
  };
  buffer.capture(interaction);
}

describe('fast-path detection integration', () => {
  beforeEach(() => {
    localStorage.clear();
    loadRules(rulesYaml);
  });

  it('routes HIGH severity matches through action router', async () => {
    const buffer = new RollingBuffer({ maxInteractions: 32, maxDurationMs: 10_000 });
    const block = vi.fn();
    const lockdown = new LockdownService();
    const lockdownStart = vi.spyOn(lockdown, 'start').mockImplementation(() => {});
    vi.spyOn(lockdown, 'stop').mockImplementation(() => {});
    const alerts: AlertsSink = { dispatch: vi.fn(async () => {}) };
    const router = new ActionRouter({
      buffer,
      evidence: new EvidenceService({ getDeviceKey: mockKey }),
      alerts,
      lockdown,
      blockNow: block,
    });

    const text = "let's switch to signal";
    captureText(buffer, text);

    const results = detectFastPath(text);
    const high = results.find((r) => r.severity === 'HIGH');
    expect(high?.label).toBeTruthy();

    if (high) {
      await router.onDetection(high.severity, high.label);
    }

    expect(block).toHaveBeenCalled();
    expect(alerts.dispatch).toHaveBeenCalled();
    expect(lockdownStart).not.toHaveBeenCalled();

    buffer.destroy();
  });

  it('triggers lockdown for CRITICAL matches', async () => {
    const buffer = new RollingBuffer({ maxInteractions: 32, maxDurationMs: 10_000 });
    const block = vi.fn();
    const lockdown = new LockdownService();
    const lockdownStart = vi.spyOn(lockdown, 'start').mockImplementation(() => {});
    vi.spyOn(lockdown, 'stop').mockImplementation(() => {});
    const alerts: AlertsSink = { dispatch: vi.fn(async () => {}) };
    const router = new ActionRouter({
      buffer,
      evidence: new EvidenceService({ getDeviceKey: mockKey }),
      alerts,
      lockdown,
      blockNow: block,
    });

    const text = 'I can pick you up after school';
    captureText(buffer, text);

    const results = detectFastPath(text);
    const critical = results.find((r) => r.severity === 'CRITICAL');
    expect(critical?.label).toBeTruthy();

    if (critical) {
      await router.onDetection(critical.severity, critical.label);
    }

    expect(block).toHaveBeenCalled();
    expect(alerts.dispatch).toHaveBeenCalled();
    expect(lockdownStart).toHaveBeenCalled();

    buffer.destroy();
  });
});
