const STORAGE_KEY = 'guardian_audit_log';

export interface AuditEntry {
  id: string;
  ts: number;
  action: 'UNLOCK';
  evidenceId: string;
  reason: string;
}

function read(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuditEntry[]) : [];
  } catch {
    return [];
  }
}

function write(entries: AuditEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function addAudit(entry: AuditEntry) {
  const entries = read();
  entries.push(entry);
  write(entries);
}

export function listAudit(): AuditEntry[] {
  return read();
}
