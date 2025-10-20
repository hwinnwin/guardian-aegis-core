let unlockedDeviceKey: CryptoKey | null = null;

export function setUnlockedDeviceKey(key: CryptoKey | null) {
  unlockedDeviceKey = key;
}

export function getUnlockedDeviceKey(): CryptoKey | null {
  return unlockedDeviceKey;
}

export function clearUnlockedDeviceKey() {
  unlockedDeviceKey = null;
}
