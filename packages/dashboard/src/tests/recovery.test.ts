import { describe, it, expect } from 'vitest';
import { generateRecoveryCode, hashRecovery } from '../core/recovery';

describe('recovery helpers', () => {
  it('generates formatted recovery code', () => {
    const code = generateRecoveryCode();
    expect(code).toMatch(/^[A-Z0-9]{4}(?:-[A-Z0-9]{4}){3}$/);
  });

  it('hashes recovery code deterministically', async () => {
    const salt = 'test-salt';
    const code = 'ABCD-EFGH-IJKL-MNOP';
    const hash1 = await hashRecovery(code, salt);
    const hash2 = await hashRecovery(code, salt);
    expect(hash1).toBe(hash2);
  });
});
