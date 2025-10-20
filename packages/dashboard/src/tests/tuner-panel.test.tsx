import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TunerPanel } from '../components/TunerPanel';

const MODEL = {
  version: 1,
  dim: 32,
  bias: 0,
  weights: Array(32).fill(0),
  createdAt: Date.now(),
  thresholds: { medium: 0.6, high: 0.9 },
};

describe('TunerPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('lg_classifier_model', JSON.stringify(MODEL));
    localStorage.setItem(
      'guardian_metrics',
      JSON.stringify({
        detections: 0,
        blocks: 0,
        critical: 0,
        advisories: 0,
        appeals: 0,
        rulesCompileErrors: 0,
        shadow: {
          total: 10,
          high: 4,
          medium: 2,
          agree: 6,
          highNoFast: 1,
          fastPathHigher: 2,
          prob: { avg: 0.5, p50: 0.5, p95: 0.9, samples: 10 },
        },
        ttb: { p50: 0, p95: 0, samples: 0 },
        ts: Date.now(),
      })
    );
  });

  it('saves adjusted thresholds and renders confusion summary', () => {
    render(<TunerPanel />);
    const mediumSlider = screen.getByLabelText(/Medium threshold/i) as HTMLInputElement;
    const highSlider = screen.getByLabelText(/High threshold/i) as HTMLInputElement;

    fireEvent.change(mediumSlider, { target: { value: '0.55' } });
    fireEvent.change(highSlider, { target: { value: '0.56' } });
    fireEvent.click(screen.getByText(/Save thresholds/i));

    const stored = JSON.parse(localStorage.getItem('lg_classifier_model') ?? '{}');
    expect(stored.thresholds.medium).toBeCloseTo(0.55, 5);
    expect(stored.thresholds.high).toBeCloseTo(0.60, 5); // adjusted to medium + 0.05

    expect(screen.getByText(/Classifier HIGH:/)).toBeInTheDocument();
  });
});
