import type { ParentAlert } from '../types/incidents';

const STORAGE_KEY = 'guardian_parent_alerts';

export function listAlerts(): ParentAlert[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}
