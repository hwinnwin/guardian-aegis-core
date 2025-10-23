const STORAGE_KEY = 'guardian_parent_alerts';

export type ParentAlertReason = {
  id?: string;
  label?: string;
  severity?: string;
};

export interface ParentAlert {
  id: string;
  severity: string;
  headline: string;
  label?: string;
  reasons?: (string | ParentAlertReason)[] | null;
  createdAt: number | string;
  evidenceId: string;
}

const isParentAlert = (value: unknown): value is ParentAlert => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const hasCoreFields =
    typeof candidate.id === 'string' &&
    typeof candidate.severity === 'string' &&
    typeof candidate.headline === 'string' &&
    typeof candidate.evidenceId === 'string' &&
    (typeof candidate.createdAt === 'number' || typeof candidate.createdAt === 'string');
  if (!hasCoreFields) {
    return false;
  }
  const reasons = candidate.reasons;
  if (reasons === undefined || reasons === null) {
    return true;
  }
  if (!Array.isArray(reasons)) {
    return false;
  }
  return reasons.every(
    (reason) =>
      typeof reason === 'string' ||
      (reason &&
        typeof reason === 'object' &&
        (typeof (reason as Record<string, unknown>).label === 'string' ||
          typeof (reason as Record<string, unknown>).severity === 'string')),
  );
};

export function getAlerts(): ParentAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isParentAlert) : [];
  } catch {
    return [];
  }
}

export function getAlertByEvidenceId(evidenceId: string): ParentAlert | undefined {
  return getAlerts().find((alert) => alert.evidenceId === evidenceId);
}
