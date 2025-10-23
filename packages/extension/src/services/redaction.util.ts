export interface RedactionPolicy {
  fields?: string[];
  blurToken?: string;
}

const INLINE_CASE_FLAG = /\(\?i\)/gi;

export function compileReasonRegexes(reasons?: string[]): RegExp[] {
  if (!Array.isArray(reasons)) return [];
  const regs: RegExp[] = [];
  for (const src of reasons) {
    if (typeof src !== 'string' || src.length === 0) continue;
    try {
      const sanitized = src.replace(INLINE_CASE_FLAG, '');
      regs.push(new RegExp(sanitized, 'i'));
    } catch {
      // ignore malformed pattern
    }
  }
  return regs;
}

function getAtPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== 'object') {
      return undefined;
    }
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

function setAtPath(obj: unknown, path: string, value: unknown) {
  if (!obj || typeof obj !== 'object') {
    return;
  }
  const parts = path.split('.');
  const last = parts.pop();
  if (!last) return;
  const target = parts.reduce<Record<string, unknown>>((acc, key) => {
    if (!acc[key] || typeof acc[key] !== 'object') {
      acc[key] = {};
    }
    return acc[key] as Record<string, unknown>;
  }, obj as Record<string, unknown>);
  target[last] = value;
}

export function redactInteraction(interaction: unknown, regs: RegExp[], policy: RedactionPolicy): unknown {
  const fields = policy.fields?.length ? policy.fields : ['data.text', 'text'];
  const blurToken = policy.blurToken ?? '•••';

  const texts = fields
    .map((path) => getAtPath(interaction, path))
    .filter((value): value is string => typeof value === 'string');

  const matched =
    regs.length > 0 &&
    texts.some((text) =>
      regs.some((rx) => {
        try {
          rx.lastIndex = 0;
          return rx.test(text);
        } catch {
          return false;
        }
      })
    );

  if (matched || regs.length === 0) {
    return interaction;
  }

  const copy = JSON.parse(JSON.stringify(interaction));
  for (const path of fields) {
    const value = getAtPath(copy, path);
    if (typeof value === 'string') {
      setAtPath(copy, path, blurToken);
    }
  }
  return copy;
}
