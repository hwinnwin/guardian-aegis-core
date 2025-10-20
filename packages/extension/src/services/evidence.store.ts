import type { EvidencePacket } from '../types/incidents';

const STORAGE_KEY = 'guardian_evidence_store';

interface StoredEvidencePacket extends Omit<EvidencePacket, 'sealed'> {
  sealed: number[];
}

function toStored(packet: EvidencePacket): StoredEvidencePacket {
  return {
    ...packet,
    sealed: Array.from(packet.sealed),
  };
}

function fromStored(packet: StoredEvidencePacket | undefined): EvidencePacket | undefined {
  if (!packet) return undefined;
  return {
    ...packet,
    sealed: new Uint8Array(packet.sealed),
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

function write(map: Record<string, StoredEvidencePacket>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function storeEvidence(packet: EvidencePacket) {
  const map = read();
  map[packet.id] = toStored(packet);
  write(map);
}

export function getEvidenceById(id: string): EvidencePacket | undefined {
  const map = read();
  return fromStored(map[id]);
}

export function listEvidence(): EvidencePacket[] {
  const map = read();
  return Object.values(map)
    .map((pkt) => fromStored(pkt))
    .filter((pkt): pkt is EvidencePacket => Boolean(pkt));
}
