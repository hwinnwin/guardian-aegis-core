import { describe, it, expect, beforeEach } from 'vitest';
import { ensureOnboardingBanner } from '../ui/onboarding';

describe('onboarding banner', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('completes onboarding after required steps', () => {
    ensureOnboardingBanner();
    expect(document.getElementById('guardian-onboarding-banner')).toBeTruthy();

    const stepDone = document.getElementById('guardian-onboarding-pin-done') as HTMLButtonElement | null;
    stepDone?.click();
    const dashboardLink = document.getElementById('guardian-onboarding-dashboard') as HTMLAnchorElement | null;
    dashboardLink?.click();

    expect(document.getElementById('guardian-onboarding-banner')).toBeNull();
    expect(localStorage.getItem('guardian_onboarded')).toBe('1');

    ensureOnboardingBanner();
    expect(document.getElementById('guardian-onboarding-banner')).toBeNull();
  });
});
