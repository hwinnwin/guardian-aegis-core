import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnlockDialog } from '../components/UnlockDialog';

async function seedEvidence(): Promise<{ id: string }> {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const jwk = await crypto.subtle.exportKey('jwk', key);
  localStorage.setItem('guardian_dev_device_key_jwk', JSON.stringify(jwk));

  const alert = {
    id: 'alert_demo',
    createdAt: Date.now(),
    severity: 'HIGH',
    headline: 'Risky content blocked',
    evidenceId: 'evidence_demo',
    label: 'move_off_platform_invite',
    reasons: ["(?i)let'?s\\s+(?:switch|move)\\s+(?:to|onto)\\s+(telegram|whatsapp|signal)"],
  };
  localStorage.setItem('guardian_parent_alerts', JSON.stringify([alert]));

  const payload = {
    createdAt: 123,
    severity: 'HIGH',
    reason: 'demo',
    interactions: [{ text: "let's switch to telegram", timestamp: 1 }],
  };

  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(payload))));

  const sealed = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  sealed.set(iv, 0);
  sealed.set(ciphertext, iv.byteLength);

  const evidenceId = 'evidence_demo';

  localStorage.setItem(
    'guardian_evidence_store',
    JSON.stringify({
      [evidenceId]: {
        id: evidenceId,
        createdAt: Date.now(),
        sealed: Array.from(sealed),
        meta: {
          severity: 'HIGH',
          reason: 'demo',
          interactionCount: 1,
        },
      },
    })
  );

  return { id: evidenceId };
}

describe('UnlockDialog', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('decrypts evidence and records audit entries', async () => {
    const { id } = await seedEvidence();

    render(<UnlockDialog evidenceId={id} onClose={() => {}} />);

    const input = screen.getByLabelText(/reason for viewing/i);
    fireEvent.change(input, { target: { value: 'Follow-up' } });

    const unlockButton = screen.getByRole('button', { name: /unlock/i });
    fireEvent.click(unlockButton);

    await waitFor(() => expect(screen.getByText(/Decrypted Evidence/i)).toBeInTheDocument());
    expect(screen.getByText(/MATCH/)).toBeInTheDocument();

    const auditRaw = localStorage.getItem('guardian_audit_log');
    expect(auditRaw).toBeTruthy();
    const audit = JSON.parse(auditRaw ?? '[]');
    expect(audit).toHaveLength(1);
    expect(audit[0].action).toBe('UNLOCK');
    expect(audit[0].reason).toBe('Follow-up');
    expect(audit[0].evidenceId).toBe(id);
  });
});
