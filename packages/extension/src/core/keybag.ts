const KEY_WDK = 'guardian_wrapped_device_key';
const KEY_JWK_DEV = 'guardian_dev_device_key_jwk';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export type WrappedDeviceKeyRecord = {
  version: 1;
  algo: 'AES-GCM';
  saltB64: string;
  iterations: number;
  ivB64: string;
  wrappedB64: string;
  createdAt: number;
};

export function hasWrappedDeviceKey(): boolean {
  return Boolean(localStorage.getItem(KEY_WDK));
}

export function getWrappedRecord(): WrappedDeviceKeyRecord | null {
  try {
    const raw = localStorage.getItem(KEY_WDK);
    return raw ? (JSON.parse(raw) as WrappedDeviceKeyRecord) : null;
  } catch {
    return null;
  }
}

export async function deriveParentKey(pin: string, salt: Uint8Array, iterations = 210_000): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function wrapDeviceKeyWithPIN(deviceKey: CryptoKey, pin: string, iterations = 210_000): Promise<WrappedDeviceKeyRecord> {
  const jwk = await crypto.subtle.exportKey('jwk', deviceKey);
  const jwkStr = JSON.stringify(jwk);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const parentKey = await deriveParentKey(pin, salt, iterations);
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, parentKey, encoder.encode(jwkStr));
  const record: WrappedDeviceKeyRecord = {
    version: 1,
    algo: 'AES-GCM',
    saltB64: toBase64(salt),
    iterations,
    ivB64: toBase64(iv),
    wrappedB64: toBase64(cipherBuffer),
    createdAt: Date.now(),
  };
  localStorage.setItem(KEY_WDK, JSON.stringify(record));
  return record;
}

export async function unwrapDeviceKeyWithPIN(pin: string): Promise<CryptoKey> {
  const record = getWrappedRecord();
  if (!record) {
    throw new Error('Wrapped device key not found');
  }
  const salt = fromBase64(record.saltB64);
  const iv = fromBase64(record.ivB64);
  const cipherText = fromBase64(record.wrappedB64);
  const parentKey = await deriveParentKey(pin, salt, record.iterations);
  const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, parentKey, cipherText);
  const jwk = JSON.parse(decoder.decode(plainBuffer));
  return crypto.subtle.importKey('jwk', jwk, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}

export async function migrateDevKeyToWrapped(pin: string): Promise<boolean> {
  const jwkStr = localStorage.getItem(KEY_JWK_DEV);
  if (!jwkStr) return false;
  try {
    const jwk = JSON.parse(jwkStr);
    const devKey = await crypto.subtle.importKey('jwk', jwk, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
    await wrapDeviceKeyWithPIN(devKey, pin);
    localStorage.removeItem(KEY_JWK_DEV);
    return true;
  } catch (err) {
    console.error('[Guardian] Failed to migrate dev device key', err);
    return false;
  }
}
