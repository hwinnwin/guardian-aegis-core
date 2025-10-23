import { describe, it, expect } from 'vitest';
import { EvidenceService } from '../services/evidence.service';
import type { Snapshot, Interaction } from '../../../buffer/src/types';

async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

type EvidencePayload = {
  label?: string;
  reasons?: string[];
  interactions: Array<{ text?: string }>;
};

async function decryptPacket(sealed: Uint8Array, key: CryptoKey): Promise<EvidencePayload> {
  const iv = sealed.slice(0, 12);
  const ciphertext = sealed.slice(12);
  const buffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(buffer)) as EvidencePayload;
}

describe('EvidenceService redaction', () => {
  it('redacts context-only interactions when reasons provided', async () => {
    const key = await generateKey();
    const svc = new EvidenceService({
      getDeviceKey: async () => key,
      redaction: { policy: { fields: ['text'], blurToken: '•••' } },
    });

    const interactions: Interaction[] = [
      { timestamp: 1, text: "let's switch to telegram", id: 'int-1', sender: { id: 'u1', name: 'Child' }, platform: 'generic' },
      { timestamp: 2, text: 'see you later', id: 'int-2', sender: { id: 'u1', name: 'Child' }, platform: 'generic' },
    ];
    const snap: Snapshot = {
      id: 'snap-1',
      capturedAt: 1_000,
      reason: 'move-off',
      threatLevel: 'HIGH',
      interactions,
    };

    const packet = await svc.sealSnapshot(snap, 'HIGH', 'move-off', {
      label: 'move_off_platform_invite',
      reasons: ["(?i)telegram"],
    });

    const payload = await decryptPacket(packet.sealed, key);
    expect(payload.label).toBe('move_off_platform_invite');
    expect(payload.reasons).toEqual(["(?i)telegram"]);
    expect(payload.interactions[0].text).toMatch(/telegram/i);
    expect(payload.interactions[1].text).toBe('•••');
  });

  it('keeps original when no reasons provided', async () => {
    const key = await generateKey();
    const svc = new EvidenceService({ getDeviceKey: async () => key });
    const snap: Snapshot = {
      id: 'snap-2',
      capturedAt: 2_000,
      reason: 'demo',
      threatLevel: 'HIGH',
      interactions: [
        {
          id: 'int-3',
          timestamp: 1,
          text: 'hello',
          sender: { id: 'child', name: 'Child' },
          platform: 'generic',
        },
      ],
    };

    const packet = await svc.sealSnapshot(snap, 'HIGH', 'demo');
    const payload = await decryptPacket(packet.sealed, key);
    expect(payload.interactions[0].text).toBe('hello');
  });
});
