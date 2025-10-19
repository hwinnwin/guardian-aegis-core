import type { ParentAlert } from '../types/incidents';

export interface AlertsSink {
  dispatch(alert: ParentAlert): Promise<void>;
}

const STORAGE_KEY = 'guardian_parent_alerts';

function readAlerts(): ParentAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAlerts(alerts: ParentAlert[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export class LocalAlertsSink implements AlertsSink {
  async dispatch(alert: ParentAlert): Promise<void> {
    const alerts = readAlerts();
    alerts.push(alert);
    writeAlerts(alerts);
    window.dispatchEvent(new CustomEvent('guardian:parent-alert', { detail: alert }));
  }
}
