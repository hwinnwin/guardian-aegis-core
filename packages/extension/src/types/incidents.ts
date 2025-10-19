export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface IncidentContext<T = unknown> {
  severity: Severity;
  reason?: string;
  timestamp: number;
  interactions: T[];
}

export interface EvidencePacket {
  id: string;
  createdAt: number;
  sealed: Uint8Array;
  meta: {
    severity: Severity;
    reason?: string;
    interactionCount: number;
  };
}

export interface ParentAlert {
  id: string;
  createdAt: number;
  severity: Severity;
  headline: string;
  evidenceId: string;
  label?: string;
  reasons?: string[];
  senderId?: string;
}

export interface SealContext {
  label?: string;
  reasons?: string[];
  patternSources?: string[];
}
