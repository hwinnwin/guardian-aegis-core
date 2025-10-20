import { webcrypto } from 'node:crypto';
import '@testing-library/jest-dom';

if (!globalThis.crypto || !('subtle' in globalThis.crypto)) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
}

const originalError = console.error;
console.error = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('Objects are not valid as a React child')) {
    originalError(...args);
    if (args.length > 1) {
      originalError('React component stack:', args.slice(1));
    }
    return;
  }
  originalError(...args);
};
