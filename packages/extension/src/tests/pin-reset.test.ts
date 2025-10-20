import { describe, it, expect, beforeEach } from 'vitest';
import { wrapDeviceKeyWithPIN, unwrapDeviceKeyWithPIN } from '../core/keybag';
import { generateRecoveryCode } from '../../../dashboard/src/core/recovery';
import { hashRecovery } from '../../../dashboard/src/core/recovery';
import { handlePinSetupRequest, handleRecoveryBridge } from '../core/pin-setup';

async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

describe('PIN reset flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('wraps new device key after recovery reset', async () => {
    // initial wrap
    const key = await generateKey();
    await wrapDeviceKeyWithPIN(key, '111111', 120_000);

    const saltInitial = toBase64(crypto.getRandomValues(new Uint8Array(16)));
    const recoveryCode = generateRecoveryCode();
    const recoveryHash = await hashRecovery(recoveryCode, saltInitial);
    localStorage.setItem('guardian_recovery_salt', saltInitial);
    localStorage.setItem('guardian_recovery_hash', recoveryHash);

    // simulate reset via recovery -> new PIN 222222
    const newPin = '222222';
    const saltNew = toBase64(crypto.getRandomValues(new Uint8Array(16)));
    const newCode = generateRecoveryCode();
    const newHash = await hashRecovery(newCode, saltNew);

    localStorage.setItem('guardian_pin_setup_pin', newPin);
    localStorage.setItem('guardian_pin_setup_request', JSON.stringify({ ts: Date.now() }));
    localStorage.setItem('guardian_recovery_salt_request', saltNew);
    localStorage.setItem('guardian_recovery_hash_request', newHash);

    await handlePinSetupRequest();
    handleRecoveryBridge();

    await expect(unwrapDeviceKeyWithPIN('222222')).resolves.toBeTruthy();
    await expect(unwrapDeviceKeyWithPIN('111111')).rejects.toThrow();
  });
});
