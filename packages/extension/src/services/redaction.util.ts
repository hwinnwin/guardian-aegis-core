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

function getAtPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function setAtPath(obj: any, path: string, value: any) {
  const parts = path.split('.');
  const last = parts.pop();
  if (!last) return;
  const target = parts.reduce((acc, key) => {
    if (acc[key] == null) acc[key] = {};
    return acc[key];
  }, obj);
  target[last] = value;
}

export function redactInteraction(interaction: any, regs: RegExp[], policy: RedactionPolicy): any {
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
