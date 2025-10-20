import { describe, it, expect, beforeEach } from 'vitest';
import { migrateDevKeyToWrapped, unwrapDeviceKeyWithPIN } from '../core/keybag';

async function generateDevJwk() {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  return crypto.subtle.exportKey('jwk', key);
}

describe('keybag migrate', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('migrates dev JWK to wrapped record using PIN', async () => {
    const jwk = await generateDevJwk();
    localStorage.setItem('guardian_dev_device_key_jwk', JSON.stringify(jwk));
    const migrated = await migrateDevKeyToWrapped('654321');
    expect(migrated).toBe(true);
    const decrypted = await unwrapDeviceKeyWithPIN('654321');
    expect(decrypted.type).toBe('secret');
  });
});
