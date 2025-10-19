import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionRouter } from '../services/action-router.service';
import { RollingBuffer } from '../../../buffer/src/core/rolling-buffer';
import { EvidenceService } from '../services/evidence.service';
import { loadRules, detectFastPath } from '../detection/engine';
import rulesYaml from '../detection/rules.fast.yaml?raw';
import { getEvidenceById } from '../services/evidence.store';

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
    const alerts: any[] = [];
    const key = await generateKey();
    const router = new ActionRouter({
      buffer,
      evidence: new EvidenceService({ getDeviceKey: async () => key, redaction: { policy: { fields: ['text'], blurToken: '•••' } } }),
      alerts: { dispatch: vi.fn(async (alert) => alerts.push(alert)) } as any,
      lockdown: { start: vi.fn(), stop: vi.fn() } as any,
      blockNow: vi.fn(),
    });

    const text = "let's switch to telegram my handle is @abc";
    buffer.capture({
      id: crypto.randomUUID ? crypto.randomUUID() : 'msg1',
      timestamp: Date.now(),
      sender: { id: 'u1', name: 'Child' },
      platform: 'generic',
      text,
    } as any);
    buffer.capture({
      id: crypto.randomUUID ? crypto.randomUUID() : 'msg2',
      timestamp: Date.now() + 1,
      sender: { id: 'u1', name: 'Child' },
      platform: 'generic',
      text: 'see you later',
    } as any);

    const [hit] = detectFastPath(text);
    expect(hit).toBeDefined();

    await router.onDetection(hit.severity, hit.label, {
      label: hit.label,
      reasons: hit.reasons,
      patternSources: hit.sources,
      senderId: 'u1',
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0].label).toBe(hit.label);
    expect(Array.isArray(alerts[0].reasons)).toBe(true);
    expect(alerts[0].reasons.length).toBeGreaterThan(0);
    expect(alerts[0].senderId).toBe('u1');

    const evidence = getEvidenceById(alerts[0].evidenceId);
    expect(evidence).toBeTruthy();
    const payload = await decryptPacket(evidence!.sealed, key);
    expect(payload.reasons).toEqual(alerts[0].reasons);
    expect(payload.interactions[0].text).toMatch(/telegram/i);
    expect(payload.interactions[1].text).toBe('•••');

    buffer.destroy();
  });
});
