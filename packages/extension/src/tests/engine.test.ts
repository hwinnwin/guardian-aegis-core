import { describe, it, expect, beforeAll } from 'vitest';
import { loadRules, detectFastPath } from '../detection/engine';
import rulesYaml from '../detection/rules.fast.yaml?raw';

describe('engine', () => {
  beforeAll(() => {
    loadRules(rulesYaml);
  });

  it('detects move-off-platform invites', () => {
    const out = detectFastPath("let's switch to Telegram my handle is @safe_chat");
    expect(out.find((x) => x.label === 'move_off_platform_invite')?.severity).toBe('HIGH');
  });

  it('detects secrecy phrases', () => {
    const out = detectFastPath("don't tell your parents ok?");
    expect(out.some((x) => x.label === 'secrecy_isolation')).toBe(true);
  });

  it('detects meet-up coordination as CRITICAL', () => {
    const out = detectFastPath('meet outside Westfield at 3 pm');
    expect(out.find((x) => x.label === 'meet_up_coordination')?.severity).toBe('CRITICAL');
  });

  it('folds leet speak to match age-gap pattern', () => {
    const out = detectFastPath('4ge is just a numb3r');
    expect(out.some((x) => x.label === 'age_gap_romance_pattern')).toBe(true);
  });
});
