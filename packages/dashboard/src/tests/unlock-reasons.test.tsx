import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UnlockDialog } from '../components/UnlockDialog';

function seedAlertAndEvidence() {
  const alert = {
    id: 'alert_1',
    createdAt: Date.now(),
    severity: 'HIGH',
    headline: 'Risky content blocked',
    evidenceId: 'evidence_1',
    label: 'move_off_platform_invite',
    reasons: ['pattern_1', 'pattern_2'],
  };
  localStorage.setItem('guardian_parent_alerts', JSON.stringify([alert]));

  const evidence = {
    evidence_1: {
      id: 'evidence_1',
      createdAt: Date.now(),
      sealed: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      meta: { severity: 'HIGH', interactionCount: 1 },
    },
  };
  localStorage.setItem('guardian_evidence_store', JSON.stringify(evidence));

  // dev device key so decrypt hook doesn't throw (unused in this test)
  localStorage.setItem('guardian_dev_device_key_jwk', JSON.stringify({ kty: 'oct', k: 'AAAA', alg: 'A256GCM' }));
}

describe('UnlockDialog reasons display', () => {
  beforeEach(() => {
    localStorage.clear();
    seedAlertAndEvidence();
  });

  it('renders alert label and reasons list', () => {
    render(<UnlockDialog evidenceId="evidence_1" onClose={() => {}} />);

    expect(screen.getByText(/Why blocked/i)).toBeInTheDocument();
    expect(screen.getByText(/move_off_platform_invite/)).toBeInTheDocument();

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('pattern_1');
    expect(items[1]).toHaveTextContent('pattern_2');
  });
});
