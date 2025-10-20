import { describe, it, expect, beforeAll } from 'vitest';
import rulesYaml from '../detection/rules.fast.yaml?raw';
import { loadRules, detectFastPath } from '../detection/engine';
import { reset, snapshot } from '../detection/metrics';

describe('engine named reasons and negatives', () => {
  beforeAll(() => {
    loadRules(rulesYaml);
  });

  it('returns friendly reason names', () => {
    reset();
    const out = detectFastPath("let's switch to telegram my handle is @safe_chat");
    const hit = out.find((entry) => entry.label === 'move_off_platform_invite');
    expect(hit).toBeTruthy();
    expect(hit?.reasons.some((reason) => /switch apps|telegram handle/i.test(reason))).toBe(true);
    expect(snapshot().detections).toBeGreaterThan(0);
  });

  it('suppresses matches when negatives fire', () => {
    reset();
    const out = detectFastPath('telegram update notes and policy changes');
    const hit = out.find((entry) => entry.label === 'move_off_platform_invite');
    expect(hit).toBeUndefined();
  });
});
