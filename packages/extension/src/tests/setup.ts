import { webcrypto } from 'node:crypto';

if (typeof globalThis.sessionStorage === 'undefined') {
  const store = new Map<string, string>();
  const storage: Storage = {
    getItem(key: string): string | null {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string): void {
      store.set(key, value);
    },
    removeItem(key: string): void {
      store.delete(key);
    },
    clear(): void {
      store.clear();
    },
    key(index: number): string | null {
      return Array.from(store.keys())[index] ?? null;
    },
    get length(): number {
      return store.size;
    },
  };

  Object.defineProperty(globalThis, 'sessionStorage', {
    value: storage,
    configurable: true,
  });
}

if (!globalThis.crypto || !('subtle' in globalThis.crypto)) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
}
