import { describe, it, expect, beforeEach } from 'vitest';
import { addAppeal, listAppeals } from '../services/appeal.store';

describe('appeal.store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds and lists appeals', () => {
    addAppeal({ id: 'a1', ts: 1, label: 'secrecy_isolation', sample: { text: 'hello' } });
    const appeals = listAppeals();
    expect(appeals).toHaveLength(1);
    expect(appeals[0].label).toBe('secrecy_isolation');
  });
});
