const STORAGE_KEY = 'guardian_parent_alerts';

export function getAlerts(): unknown[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getAlertByEvidenceId(evidenceId: string) {
  const alerts = getAlerts();
  return alerts.find((a) => a.evidenceId === evidenceId);
}
