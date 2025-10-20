import { describe, it, expect } from 'vitest';

let manifest: any = {};
try {
  manifest = require('../public/manifest.json');
} catch (error) {
  manifest = {};
}

describe('MV3 manifest security', () => {
  it('uses MV3', () => {
    expect(manifest.manifest_version).toBe(3);
  });

  it('has minimal permissions', () => {
    const perms = new Set(manifest.permissions || []);
    const forbidden = ['tabs', 'debugger', 'clipboardWrite', 'clipboardRead', 'webRequestBlocking'];
    expect(forbidden.some((p) => perms.has(p))).toBe(false);
  });

  it('defines a background service worker', () => {
    expect(manifest.background?.service_worker).toBeTruthy();
  });
});
