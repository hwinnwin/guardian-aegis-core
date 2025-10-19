import type { EvidencePacket } from '../../../extension/src/types/incidents';

const STORAGE_KEY = 'guardian_evidence_store';

interface StoredEvidencePacket extends Omit<EvidencePacket, 'sealed'> {
  sealed: number[];
}

function toPacket(raw: StoredEvidencePacket | undefined): EvidencePacket | undefined {
  if (!raw) return undefined;
  return {
    ...raw,
    sealed: new Uint8Array(raw.sealed),
  };
}

function read(): Record<string, StoredEvidencePacket> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StoredEvidencePacket>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function listEvidence(): EvidencePacket[] {
  return Object.values(read())
    .map((pkt) => toPacket(pkt))
    .filter((pkt): pkt is EvidencePacket => Boolean(pkt));
}

export function getEvidenceById(id: string): EvidencePacket | undefined {
  return toPacket(read()[id]);
}
