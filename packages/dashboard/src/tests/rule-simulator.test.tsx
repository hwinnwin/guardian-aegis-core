import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { RuleSimulator } from '../components/RuleSimulator';

describe('RuleSimulator', () => {
  it('detects rules and displays hits', () => {
    render(<RuleSimulator />);

    const textarea = screen.getByPlaceholderText('Paste a message…');
    fireEvent.change(textarea, { target: { value: "let's switch to telegram" } });
    fireEvent.click(screen.getByText('Detect'));

    expect(screen.getByText(/move_off_platform_invite/)).toBeInTheDocument();
  });
});
