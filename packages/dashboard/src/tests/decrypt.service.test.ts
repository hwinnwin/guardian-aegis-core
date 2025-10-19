import { describe, it, expect, beforeEach } from 'vitest';
import { decryptEvidence } from '../services/decrypt.service';

describe('decryptEvidence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('fails if dev key is unavailable', async () => {
    localStorage.removeItem('guardian_dev_device_key_jwk');
    await expect(decryptEvidence(new Uint8Array([0, 1, 2]))).rejects.toThrow();
  });
});
