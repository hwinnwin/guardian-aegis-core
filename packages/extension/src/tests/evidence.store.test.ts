import { describe, it, expect, beforeEach } from 'vitest';
import { storeEvidence, getEvidenceById } from '../services/evidence.store';
import type { EvidencePacket } from '../types/incidents';

describe('evidence.store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and retrieves packets by id with Uint8Array sealing', () => {
    const packet: EvidencePacket = {
      id: 'pkt_1',
      createdAt: Date.now(),
      sealed: new Uint8Array([1, 2, 3, 4]),
      meta: {
        severity: 'HIGH',
        reason: 'test',
        interactionCount: 1,
      },
    };

    storeEvidence(packet);
    const loaded = getEvidenceById('pkt_1');

    expect(loaded).toBeTruthy();
    expect(loaded?.id).toBe('pkt_1');
    expect(loaded?.sealed instanceof Uint8Array).toBe(true);
    expect(Array.from(loaded?.sealed ?? [])).toEqual([1, 2, 3, 4]);
  });
});
