import { describe, it, expect, beforeEach } from 'vitest';
import { showEducationCard } from '../ui/edu-card';

describe('education card UI', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders and can be dismissed', () => {
    showEducationCard({ label: 'secrecy_isolation', tips: ['tip'] });
    const card = document.getElementById('guardian-edu-card');
    expect(card).toBeTruthy();
    const okButton = document.getElementById('guardian-edu-ok');
    expect(okButton).toBeTruthy();
    okButton?.dispatchEvent(new Event('click'));
    expect(document.getElementById('guardian-edu-card')).toBeNull();
  });
});
