import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnlockDialog } from '../components/UnlockDialog';

const interactions = [
  { timestamp: Date.now() - 1000, data: { text: "let's switch to telegram" } },
  { timestamp: Date.now(), data: { text: 'cool see you' } },
];

vi.mock('../services/decrypt.service', () => ({
  decryptEvidence: vi.fn(async () => ({
    interactions,
  })),
}));

function setupStorage() {
  const alert = {
    id: 'alert_1',
    createdAt: Date.now(),
    severity: 'HIGH',
    headline: 'Risky content blocked',
    evidenceId: 'evidence_1',
    label: 'move_off_platform_invite',
    reasons: ["(?i)let'?s\\s+(?:switch|move)\\s+(?:to|onto)\\s+(telegram|whatsapp|signal)"],
  };

  localStorage.setItem('guardian_parent_alerts', JSON.stringify([alert]));

  const evidence = {
    evidence_1: {
      id: 'evidence_1',
      createdAt: Date.now(),
      sealed: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      meta: { severity: 'HIGH', interactionCount: interactions.length },
    },
  };

  localStorage.setItem('guardian_evidence_store', JSON.stringify(evidence));

  // store dev key placeholder (not used because we won't actually decrypt)
  localStorage.setItem('guardian_dev_device_key_jwk', JSON.stringify({ kty: 'oct', k: 'AAAA', alg: 'A256GCM' }));
}

describe('UnlockDialog highlighting', () => {
  beforeEach(() => {
    localStorage.clear();
    setupStorage();
  });

  it('shows MATCH badge and matched-by list after unlock', async () => {
    render(<UnlockDialog evidenceId="evidence_1" onClose={() => {}} />);

    const input = screen.getByLabelText(/Reason for viewing/i);
    fireEvent.change(input, { target: { value: 'Follow-up' } });

    const button = screen.getByRole('button', { name: /Unlock/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/MATCH/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Matched by:/i)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
    expect(screen.getByText(/context/)).toBeInTheDocument();
  });
});
