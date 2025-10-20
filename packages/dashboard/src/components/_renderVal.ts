export function renderVal(v: unknown): string {
  if (v == null) return '—';

  const t = typeof v;
  if (t === 'string' || t === 'number' || t === 'boolean') {
    return String(v);
  }

  if (t === 'object') {
    const candidate = v as { $$typeof?: unknown } | null;
    if (candidate && '$$typeof' in candidate) {
      return '[element]';
    }
  }

  try {
    return JSON.stringify(v);
  } catch {
    return '[object]';
  }
}
