export interface InteractionLike {
  timestamp: number;
  data?: Record<string, unknown> | null;
}

export interface MatchAnnotation {
  matched: boolean;
  matchedBy: string[];
}

const INLINE_CASE_FLAG = /\(\?i\)/gi;

function sanitize(pattern: string): string | null {
  if (typeof pattern !== 'string' || pattern.length === 0) return null;
  return pattern.replace(INLINE_CASE_FLAG, '');
}

export function compileReasons(reasons?: string[]): RegExp[] {
  if (!Array.isArray(reasons)) return [];
  return reasons
    .map(sanitize)
    .filter((src): src is string => Boolean(src))
    .map((src) => {
      try {
        return new RegExp(src, 'i');
      } catch {
        return null;
      }
    })
    .filter((rx): rx is RegExp => Boolean(rx));
}

export function annotateInteractions(
  interactions: InteractionLike[],
  reasons?: string[]
): MatchAnnotation[] {
  const regs = compileReasons(reasons);
  return interactions.map((interaction) => {
    const text =
      (interaction?.data as { text?: string } | undefined)?.text ??
      (interaction as { text?: string } | undefined)?.text ??
      '';
    const matchedBy: string[] = [];

    for (const rx of regs) {
      if (rx.test(text)) {
        matchedBy.push(rx.source);
      }
    }

    return {
      matched: matchedBy.length > 0,
      matchedBy,
    };
  });
}
