import { describe, it, expect } from 'vitest';
import { compileReasonRegexes, redactInteraction } from '../services/redaction.util';

const policy = { fields: ['text'], blurToken: '•••' } as const;

describe('redaction.util', () => {
  it('keeps matched interactions intact', () => {
    const regs = compileReasonRegexes(["(?i)telegram"]);
    const interaction = { timestamp: 1, text: "let's switch to telegram" };
    const out = redactInteraction(interaction, regs, policy);
    expect(out.text).toMatch(/telegram/i);
  });

  it('redacts non-matching interactions', () => {
    const regs = compileReasonRegexes(["(?i)telegram"]);
    const interaction = { timestamp: 2, text: 'see you later' };
    const out = redactInteraction(interaction, regs, policy);
    expect(out.text).toBe('•••');
  });

  it('ignores broken regex patterns', () => {
    const regs = compileReasonRegexes(["(?i)telegram", '(']);
    const interaction = { timestamp: 3, text: 'hello' };
    const out = redactInteraction(interaction, regs, policy);
    expect(out.text).toBe('•••');
  });
});
