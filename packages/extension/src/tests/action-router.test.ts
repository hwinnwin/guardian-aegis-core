import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ActionRouter } from '../services/action-router.service';
import { RollingBuffer } from '../../../buffer/src/core/rolling-buffer';
import { EvidenceService } from '../services/evidence.service';
import { LocalAlertsSink } from '../services/alerts.service';
import { LockdownService } from '../services/lockdown.service';
import { getEvidenceById } from '../services/evidence.store';
import type { Interaction } from '../../../buffer/src/types';

function createInteraction(id: string, text: string, timestamp: number): Interaction {
  return {
    id,
    text,
    sender: { id: `sender-${id}`, name: 'Child' },
    platform: 'generic',
    timestamp,
  };
}

async function mockKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

describe('ActionRouter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000_000_000);
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('blocks, snapshots, and alerts on HIGH severity detections', async () => {
    const buffer = new RollingBuffer({ maxInteractions: 10, maxDurationMs: 10_000, cleanupIntervalMs: 1_000 });
    for (let i = 0; i < 5; i += 1) {
      buffer.capture(createInteraction(String(i), `turn-${i}`, Date.now() + i));
    }

    const blockSpy = vi.fn();
    const alertsSink = new LocalAlertsSink();
    const alertsSpy = vi.spyOn(alertsSink, 'dispatch');
    const lockdown = new LockdownService();
    vi.spyOn(lockdown, 'start');

    const router = new ActionRouter({
      buffer,
      evidence: new EvidenceService({ getDeviceKey: mockKey }),
      alerts: alertsSink,
      lockdown,
      blockNow: blockSpy,
    });

    await router.onDetection('HIGH', 'test-alert');

    expect(blockSpy).toHaveBeenCalledWith({ reason: 'test-alert' });
    expect(alertsSpy).toHaveBeenCalledTimes(1);

    const [alert] = alertsSpy.mock.calls[0];
    expect(alert.severity).toBe('HIGH');
    expect(alert.headline).toBe('test-alert');

    const storedAlerts = JSON.parse(localStorage.getItem('guardian_parent_alerts') ?? '[]');
    expect(storedAlerts).toHaveLength(1);
    expect(storedAlerts[0].evidenceId).toBeDefined();

    const storedPacket = getEvidenceById(storedAlerts[0].evidenceId);
    expect(storedPacket?.sealed instanceof Uint8Array).toBe(true);
    expect(storedPacket?.meta.interactionCount).toBeGreaterThan(0);

    buffer.destroy();
  });

  it('initiates lockdown for CRITICAL detections', async () => {
    const buffer = new RollingBuffer({ maxInteractions: 10, maxDurationMs: 10_000, cleanupIntervalMs: 1_000 });
    const lockdown = new LockdownService();
    const lockdownSpy = vi.spyOn(lockdown, 'start');

    const router = new ActionRouter({
      buffer,
      evidence: new EvidenceService({ getDeviceKey: mockKey }),
      alerts: { dispatch: vi.fn(async () => {}) },
      lockdown,
      blockNow: vi.fn(),
    });

    await router.onDetection('CRITICAL', 'critical-threat');

    expect(lockdownSpy).toHaveBeenCalledWith(60_000);

    lockdown.stop();
    buffer.destroy();
  });
});
