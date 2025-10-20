import { describe, it, expect } from 'vitest';
import { annotateInteractions } from '../services/highlight';

describe('highlight annotateInteractions', () => {
  it('flags interactions that match any reason regex', () => {
    const interactions = [
      { timestamp: 1, data: { text: "let's switch to telegram" } },
      { timestamp: 2, data: { text: 'ok see you' } },
    ];
    const reasons = ["(?i)let'?s\\s+(?:switch|move)\\s+(?:to|onto)\\s+(telegram|whatsapp|signal)"];
    const annotations = annotateInteractions(interactions, reasons);

    expect(annotations[0].matched).toBe(true);
    expect(annotations[0].matchedBy.length).toBeGreaterThan(0);
    expect(annotations[1].matched).toBe(false);
  });
});
