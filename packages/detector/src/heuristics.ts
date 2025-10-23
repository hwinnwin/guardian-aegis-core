/**
 * Guardian Aegis detector heuristics.
 *
 * These rules must remain deterministic and side-effect free:
 * - No filesystem/network access
 * - No randomness without an injected seed
 * - Pure string matching / scoring only
 */
export type Rule = {
  id: string;
  test: (text: string) => boolean;
  weight?: number;
};

const defaultRules: Rule[] = [
  { id: "R-AGE-ASK", test: (t) => /\b(how old|what.?age)\b/i.test(t), weight: 0.25 },
  { id: "R-LOCATION-ASK", test: (t) => /\b(where (do you|are you)|address|which city)\b/i.test(t), weight: 0.25 },
  { id: "R-PLATFORM-SWITCH", test: (t) => /\b(snap|telegram|whatsapp|dm me|private chat)\b/i.test(t), weight: 0.3 },
  { id: "R-COERCION", test: (t) => /\b(don't tell|keep this secret|our secret)\b/i.test(t), weight: 0.35 }
];

/**
 * Evaluate text against the provided heuristics and return a bounded score.
 */
export function scoreHeuristics(text: string, rules: Rule[] = defaultRules): { score: number; reasons: string[] } {
  const trimmed = text || "";
  let accumulator = 0;
  const reasons: string[] = [];

  for (const rule of rules) {
    if (rule.test(trimmed)) {
      accumulator += rule.weight ?? 0.2;
      reasons.push(rule.id);
    }
  }

  const score = Math.max(0, Math.min(1, accumulator));
  return { score, reasons };
}

export { defaultRules };
