import { describe, it, expect } from 'vitest';
import manifestJson from '../public/manifest.json';

type ExtensionManifest = {
  manifest_version?: number;
  permissions?: string[];
  background?: {
    service_worker?: string;
  };
};

const manifest = manifestJson as ExtensionManifest;

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
