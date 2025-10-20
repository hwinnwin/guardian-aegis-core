import { __DEV__ } from './env';

const STORAGE_KEY = 'guardian_device_key_jwk';

export async function getOrCreateDeviceKey(): Promise<CryptoKey> {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    const jwk = JSON.parse(existing);
    return crypto.subtle.importKey('jwk', jwk, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
  }

  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const jwk = await crypto.subtle.exportKey('jwk', key);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jwk));
  return key;
}

export async function exportDeviceKeyJWKForDev(): Promise<JsonWebKey | null> {
  if (!__DEV__) return null;
  const jwkStr = localStorage.getItem(STORAGE_KEY);
  return jwkStr ? JSON.parse(jwkStr) : null;
}
