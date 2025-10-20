import { describe, it, expect } from 'vitest';
import { EvidenceService } from '../services/evidence.service';
import type { Snapshot, Interaction } from '../../../buffer/src/types';

async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

describe('EvidenceService', () => {
  it('seals snapshot payloads with AES-GCM', async () => {
    const svc = new EvidenceService({ getDeviceKey: generateKey });
    const interactions: Interaction[] = [
      {
        id: '1',
        text: 'hi',
        sender: { id: 's', name: 'Child' },
        platform: 'generic',
        timestamp: 1,
      },
    ];

    const snapshot: Snapshot = {
      id: 'evidence_x',
      interactions,
      capturedAt: 1_234,
      reason: 'test',
      threatLevel: 'HIGH',
    };

    const packet = await svc.sealSnapshot(snapshot, 'HIGH', 'reason');

    expect(packet.id).toBe('evidence_x');
    expect(packet.createdAt).toBe(1_234);
    expect(packet.sealed instanceof Uint8Array).toBe(true);
    expect(packet.sealed.byteLength).toBeGreaterThan(12);
    expect(packet.sealed.slice(0, 12).length).toBe(12);
    expect(packet.meta.interactionCount).toBe(1);
    expect(packet.meta.severity).toBe('HIGH');
  });
});
