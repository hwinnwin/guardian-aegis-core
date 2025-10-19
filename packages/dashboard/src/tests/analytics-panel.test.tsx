import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { AnalyticsPanel } from '../components/AnalyticsPanel';

describe('AnalyticsPanel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('displays metrics snapshot', () => {
    localStorage.setItem(
      'guardian_metrics',
      JSON.stringify({
        detections: 3,
        blocks: 2,
        critical: 1,
        advisories: 4,
        appeals: 1,
        ttb: { p50: 120, p95: 250, samples: 3 },
        ts: Date.now(),
      })
    );

    render(<AnalyticsPanel />);

    expect(screen.getByText('Detections')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('TTB p95 (ms)')).toBeInTheDocument();
  });
});
