import { describe, it, expect } from 'vitest';
import { EvidenceService } from '../services/evidence.service';

async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

async function decryptPacket(sealed: Uint8Array, key: CryptoKey) {
  const iv = sealed.slice(0, 12);
  const ciphertext = sealed.slice(12);
  const buffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(buffer));
}

describe('EvidenceService redaction', () => {
  it('redacts context-only interactions when reasons provided', async () => {
    const key = await generateKey();
    const svc = new EvidenceService({
      getDeviceKey: async () => key,
      redaction: { policy: { fields: ['text'], blurToken: '•••' } },
    });

    const snap = {
      id: 'snap-1',
      createdAt: 1_000,
      threatLevel: 'HIGH',
      interactions: [
        { timestamp: 1, text: "let's switch to telegram" },
        { timestamp: 2, text: 'see you later' },
      ],
    } as any;

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
    const snap = {
      id: 'snap-2',
      createdAt: 2_000,
      threatLevel: 'HIGH',
      interactions: [{ timestamp: 1, text: 'hello' }],
    } as any;

    const packet = await svc.sealSnapshot(snap, 'HIGH', 'demo');
    const payload = await decryptPacket(packet.sealed, key);
    expect(payload.interactions[0].text).toBe('hello');
  });
});
