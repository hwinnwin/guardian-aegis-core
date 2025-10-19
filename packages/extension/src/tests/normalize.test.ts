import { describe, it, expect } from 'vitest';
import { foldBasic, emojiHints } from '../detection/normalize';

describe('normalize', () => {
  it('folds leetspeak terms', () => {
    expect(foldBasic('t3l3gr4m')).toContain('te');
    expect(foldBasic('ph0ne')).toBe('phone');
  });

  it('adds emoji hints', () => {
    expect(emojiHints('🤫')).toMatch(/dont tell/);
    expect(emojiHints('📱')).toMatch(/phone/);
  });
});
