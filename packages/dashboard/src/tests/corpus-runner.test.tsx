import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CorpusRunner } from '../components/CorpusRunner';

const MODEL = {
  version: 1,
  dim: 32,
  bias: 3,
  weights: Array(32).fill(0),
  createdAt: Date.now(),
  thresholds: { high: 0.8, medium: 0.6 },
};

describe('CorpusRunner', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('lg_classifier_model', JSON.stringify(MODEL));
  });

  it('produces summary for corpora', () => {
    render(<CorpusRunner />);
    const positives = screen.getByText('Positive corpus').nextElementSibling as HTMLTextAreaElement;
    const negatives = screen.getByText('Negative corpus').nextElementSibling as HTMLTextAreaElement;

    fireEvent.change(positives, { target: { value: "let's switch to telegram" } });
    fireEvent.change(negatives, { target: { value: 'family dinner at six' } });
    fireEvent.click(screen.getByText('Run evaluation'));

    expect(screen.getByText(/TP:/)).toBeInTheDocument();
    expect(screen.getByText(/Fast-path HIGH\/CRIT/)).toBeInTheDocument();
  });
});
