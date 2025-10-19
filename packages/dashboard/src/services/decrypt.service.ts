import { __DEV__ } from '../core/env';

function ensureUint8Array(value: Uint8Array | number[]): Uint8Array {
  return value instanceof Uint8Array ? value : new Uint8Array(value);
}

export async function getDevDeviceKey(): Promise<CryptoKey> {
  if (!__DEV__) {
    throw new Error('Device key unavailable in production builds');
  }

  const jwkStr = localStorage.getItem('guardian_dev_device_key_jwk');
  if (!jwkStr) {
    throw new Error('Dev device JWK not found. Open the extension context first.');
  }

  const jwk = JSON.parse(jwkStr);
  return crypto.subtle.importKey('jwk', jwk, { name: 'AES-GCM' }, true, ['decrypt']);
}

export async function decryptEvidence(sealed: Uint8Array | number[], deviceKeyOverride?: CryptoKey): Promise<unknown> {
  const payload = ensureUint8Array(sealed);

  if (payload.byteLength < 12) {
    throw new Error('Invalid packet: missing IV');
  }

  const iv = payload.slice(0, 12);
  const ciphertext = payload.slice(12);

  const key = deviceKeyOverride ?? (await getDevDeviceKey());
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(decrypted));
}
