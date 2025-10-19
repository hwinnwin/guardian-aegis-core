interface AppealRecord {
  id: string;
  ts: number;
  label: string;
  sample: {
    text?: string;
  };
}

const KEY = 'guardian_appeals';

function readAppeals(): AppealRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAppeals(records: AppealRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(records));
}

export function addAppeal(record: AppealRecord) {
  const entries = readAppeals();
  entries.push(record);
  writeAppeals(entries);
}

export function listAppeals(): AppealRecord[] {
  return readAppeals();
}
