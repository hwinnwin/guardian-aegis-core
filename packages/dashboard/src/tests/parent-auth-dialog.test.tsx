import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ParentAuthDialog } from '../components/ParentAuthDialog';
import { wrapDeviceKeyWithPIN } from '../../../extension/src/core/keybag';

async function generateDeviceKey() {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

describe('ParentAuthDialog', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('unlocks wrapped device key with correct PIN', async () => {
    const key = await generateDeviceKey();
    await wrapDeviceKeyWithPIN(key, '123456', 100_000);
    const onSuccess = vi.fn();

    render(<ParentAuthDialog mode="unlock" onCancel={() => {}} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('Enter PIN'), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Unlock'));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onSuccess.mock.calls[0][0]).toBeTruthy();
  });
});
