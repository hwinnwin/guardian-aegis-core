import { describe, it, expect, beforeEach } from 'vitest';
import { wrapDeviceKeyWithPIN, unwrapDeviceKeyWithPIN, getWrappedRecord } from '../core/keybag';

async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

describe('keybag wrap/unwrap', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('wraps and unwraps device key with PIN', async () => {
    const deviceKey = await generateKey();
    await wrapDeviceKeyWithPIN(deviceKey, '123456', 120_000);
    const record = getWrappedRecord();
    expect(record).toBeTruthy();
    const unwrapped = await unwrapDeviceKeyWithPIN('123456');

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const msg = new TextEncoder().encode('guardian');
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, unwrapped, msg);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, unwrapped, cipher);
    expect(new TextDecoder().decode(plain)).toBe('guardian');
  });
});
