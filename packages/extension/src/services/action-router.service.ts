import type { Severity } from '../types/incidents';
import type { IRollingBuffer } from '../../../buffer/src/core/interfaces';
import type { ThreatLevel } from '../../../buffer/src/types';
import type { EvidenceService } from './evidence.service';
import type { AlertsSink } from './alerts.service';
import type { LockdownService } from './lockdown.service';
import { storeEvidence } from './evidence.store';
import { inc } from '../detection/metrics';
import { showEducationCard } from '../ui/edu-card';
import { getTipsForLabel } from '../detection/tips';
import { addTTB } from '../detection/metrics';
import { publishMetrics } from './telemetry.store';

const severityToThreatLevel = (severity: Severity): ThreatLevel => severity as ThreatLevel;

export interface ActionRouterDeps {
  buffer: IRollingBuffer;
  evidence: EvidenceService;
  alerts: AlertsSink;
  lockdown: LockdownService;
  blockNow: (opts: { reason: string }) => void;
}

export class ActionRouter {
  constructor(private readonly deps: ActionRouterDeps) {}

  onAdvisory(level: 'LOW' | 'MEDIUM', ctx?: { label?: string }) {
    const label = ctx?.label ?? (level === 'LOW' ? 'risky content' : 'potential grooming pattern');
    const tips = getTipsForLabel(label);
    showEducationCard({ label, tips });
    inc('advisories');
    publishMetrics();
  }

  async onDetection(
    level: Severity,
    reason?: string,
    ctx?: {
      label?: string;
      reasons?: string[];
      patternSources?: string[];
      senderId?: string;
      messageTs?: number;
    }
  ) {
    const isHigh = level === 'HIGH' || level === 'CRITICAL';
    if (!isHigh) return;

    const resolvedReason = reason ?? ctx?.label ?? 'Risky content';
    inc('detections');

    this.deps.blockNow({ reason: resolvedReason });
    inc('blocks');
    if (typeof ctx?.messageTs === 'number') {
      addTTB(Date.now() - ctx.messageTs);
    }

    const snapshot = this.deps.buffer.freezeOnThreat(severityToThreatLevel(level), resolvedReason);
    const packet = await this.deps.evidence.sealSnapshot(snapshot, level, resolvedReason, {
      label: ctx?.label,
      reasons: ctx?.reasons,
      patternSources: ctx?.patternSources,
    });
    storeEvidence(packet);

    await this.deps.alerts.dispatch({
      id: `alert_${packet.id}`,
      createdAt: packet.createdAt,
      severity: level,
      headline: resolvedReason,
      evidenceId: packet.id,
      label: ctx?.label,
      reasons: ctx?.reasons,
      senderId: ctx?.senderId,
    });

    if (level === 'CRITICAL') {
      this.deps.lockdown.start(60_000);
      inc('critical');
    }

    publishMetrics();
  }
}
