import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RollingBuffer } from '../../../buffer/src/core/rolling-buffer';
import { EvidenceService } from '../services/evidence.service';
import { ActionRouter } from '../services/action-router.service';
import { classifyAdvisory } from '../detection/decide';
import type { Interaction } from '../../../buffer/src/types';

async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

describe('flow classifier', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('does not dispatch alerts for classifier medium advisory', async () => {
    const buffer = new RollingBuffer<any>({ maxInteractions: 16, maxDurationMs: 10_000 });
    const alerts = { dispatch: vi.fn() } as any;
    const router = new ActionRouter({
      buffer,
      evidence: new EvidenceService({ getDeviceKey: generateKey }),
      alerts,
      lockdown: { start: vi.fn(), stop: vi.fn() } as any,
      blockNow: vi.fn(),
    });

    const interaction: Interaction = {
      id: 'i1',
      text: 'can you text me later tonight',
      sender: { id: 'child', name: 'Child' },
      platform: 'generic',
      timestamp: Date.now(),
    };
    buffer.capture(interaction);
    const model = {
      version: 1 as const,
      dim: 32,
      bias: 1,
      weights: new Float32Array(32),
      createdAt: Date.now(),
      thresholds: { high: 0.99, medium: 0.5 },
    };
    const level = classifyAdvisory('can you text me later tonight', model, ['text me']);
    if (level === 'MEDIUM') {
      router.onAdvisory('MEDIUM', { label: 'ml_layer1' });
    }

    expect(alerts.dispatch).not.toHaveBeenCalled();
  });
});
