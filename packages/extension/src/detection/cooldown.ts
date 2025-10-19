type Key = string;

const MEM = new Map<Key, number>();

function setTimestamp(key: Key, ts: number) {
  try {
    sessionStorage.setItem(`guardian_cd_${key}`, String(ts));
  } catch {
    MEM.set(key, ts);
  }
}

function getTimestamp(key: Key): number {
  try {
    const raw = sessionStorage.getItem(`guardian_cd_${key}`);
    return raw ? Number(raw) : 0;
  } catch {
    return MEM.get(key) ?? 0;
  }
}

export function shouldSuppress(
  nowMs: number,
  windowMs: number,
  senderId: string | undefined,
  label: string | undefined,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
): boolean {
  const key: Key = `${senderId ?? 'anon'}|${label ?? 'nolabel'}|${severity}`;
  const last = getTimestamp(key);
  if (last > 0 && nowMs - last < windowMs) {
    return true;
  }
  setTimestamp(key, nowMs);
  return false;
}
