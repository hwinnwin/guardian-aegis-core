import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionRouter } from '../services/action-router.service';
import { RollingBuffer } from '../../../buffer/src/core/rolling-buffer';
import { EvidenceService } from '../services/evidence.service';
import { loadRules, detectFastPath } from '../detection/engine';
import rulesYaml from '../detection/rules.fast.yaml?raw';
import { getEvidenceById } from '../services/evidence.store';
import type { AlertsSink } from '../services/alerts.service';
import { LockdownService } from '../services/lockdown.service';
import type { Interaction } from '../../../buffer/src/types';
import type { ParentAlert } from '../types/incidents';

async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

async function decryptPacket(sealed: Uint8Array, key: CryptoKey) {
  const iv = sealed.slice(0, 12);
  const ciphertext = sealed.slice(12);
  const buffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(buffer));
}

describe('alert reasons propagation', () => {
  beforeEach(() => {
    localStorage.clear();
    loadRules(rulesYaml);
  });

  it('includes label and reasons in parent alerts', async () => {
    const buffer = new RollingBuffer({ maxInteractions: 10, maxDurationMs: 10_000 });
    const alerts: ParentAlert[] = [];
    const key = await generateKey();
    const lockdown = new LockdownService();
    const lockdownStart = vi.spyOn(lockdown, 'start').mockImplementation(() => {});
    vi.spyOn(lockdown, 'stop').mockImplementation(() => {});
    const alertSink: AlertsSink = {
      dispatch: vi.fn(async (alert) => {
        alerts.push(alert);
      }),
    };
    const router = new ActionRouter({
      buffer,
      evidence: new EvidenceService({ getDeviceKey: async () => key, redaction: { policy: { fields: ['text'], blurToken: '•••' } } }),
      alerts: alertSink,
      lockdown,
      blockNow: vi.fn(),
    });

    const text = "let's switch to telegram my handle is @abc";
    const firstInteraction: Interaction = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'msg1',
      timestamp: Date.now(),
      sender: { id: 'u1', name: 'Child' },
      platform: 'generic',
      text,
    };
    buffer.capture(firstInteraction);
    const secondInteraction: Interaction = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'msg2',
      timestamp: Date.now() + 1,
      sender: { id: 'u1', name: 'Child' },
      platform: 'generic',
      text: 'see you later',
    };
    buffer.capture(secondInteraction);

    const [hit] = detectFastPath(text);
    expect(hit).toBeDefined();

    await router.onDetection(hit.severity, hit.label, {
      label: hit.label,
      reasons: hit.reasons,
      patternSources: hit.sources,
      senderId: 'u1',
    });

    expect(alerts).toHaveLength(1);
    const [alert] = alerts;
    expect(alert.label).toBe(hit.label);
    expect(Array.isArray(alert.reasons)).toBe(true);
    expect(alert.reasons.length).toBeGreaterThan(0);
    expect(alert.senderId).toBe('u1');

    const evidence = getEvidenceById(alert.evidenceId);
    expect(evidence).toBeTruthy();
    const payload = await decryptPacket(evidence!.sealed, key);
    expect(payload.reasons).toEqual(alert.reasons);
    expect(payload.interactions[0].text).toMatch(/telegram/i);
    expect(payload.interactions[1].text).toBe('•••');

    buffer.destroy();
    expect(lockdownStart).not.toHaveBeenCalled();
  });
});
