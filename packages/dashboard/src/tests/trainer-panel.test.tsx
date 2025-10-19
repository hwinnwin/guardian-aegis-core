import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TrainerPanel } from '../components/TrainerPanel';

describe('TrainerPanel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('trains and stores model', () => {
    render(<TrainerPanel />);
    fireEvent.click(screen.getByText('Train & Save Model'));
    const stored = localStorage.getItem('lg_classifier_model');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored ?? '{}');
    expect(Array.isArray(parsed.weights)).toBe(true);
  });
});
