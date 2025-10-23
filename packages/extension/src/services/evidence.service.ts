import type { EvidencePacket, Severity, SealContext } from '../types/incidents';
import type { Snapshot } from '../../../buffer/src/types';
import { compileReasonRegexes, redactInteraction, RedactionPolicy } from './redaction.util';

export interface EvidenceServiceConfig {
  getDeviceKey(): Promise<CryptoKey>;
  redaction?: {
    policy?: RedactionPolicy;
  };
}

export class EvidenceService {
  constructor(private readonly cfg: EvidenceServiceConfig) {}

  async sealSnapshot<T>(
    snap: Snapshot & { interactions: T[] },
    severity: Severity,
    reason?: string,
    ctx?: SealContext
  ): Promise<EvidencePacket> {
    const key = await this.cfg.getDeviceKey();
    const createdAt = (snap as Snapshot & { capturedAt?: number }).capturedAt ?? Date.now();

    const policy: RedactionPolicy = this.cfg.redaction?.policy ?? { fields: ['text', 'data.text'], blurToken: '•••' };
    const regs = compileReasonRegexes(ctx?.patternSources ?? ctx?.reasons);
    const redactedInteractions = snap.interactions.map((interaction) =>
      redactInteraction(interaction, regs, policy)
    );

    const payload = new TextEncoder().encode(
      JSON.stringify({
        createdAt,
        severity,
        reason,
        label: ctx?.label,
        reasons: ctx?.reasons,
        interactions: redactedInteractions,
      })
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const sealedBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, payload);
    const sealed = new Uint8Array(iv.byteLength + sealedBuffer.byteLength);
    sealed.set(iv, 0);
    sealed.set(new Uint8Array(sealedBuffer), iv.byteLength);

    return {
      id: snap.id,
      createdAt,
      sealed,
      meta: {
        severity,
        reason,
        interactionCount: redactedInteractions.length,
      },
    };
  }
}
