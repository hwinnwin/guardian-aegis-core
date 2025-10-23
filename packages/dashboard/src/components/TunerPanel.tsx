import React from 'react';
import { renderVal } from './_renderVal';

interface Thresholds {
  medium: number;
  high: number;
}

type ShadowMetrics = {
  total?: number;
  high?: number;
  highNoFast?: number;
  fastPathHigher?: number;
  agree?: number;
};

type GuardianMetrics = {
  shadow?: ShadowMetrics;
  [key: string]: unknown;
};

const DEFAULT_THRESHOLDS: Thresholds = { medium: 0.7, high: 0.9 };

function readModel(): { thresholds: Thresholds; raw: unknown } | null {
  try {
    const raw = localStorage.getItem('lg_classifier_model');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { thresholds?: Thresholds };
    const candidate = parsed?.thresholds;
    const thresholds =
      candidate &&
      typeof candidate.medium === 'number' &&
      typeof candidate.high === 'number'
        ? candidate
        : DEFAULT_THRESHOLDS;
    return { thresholds, raw: parsed };
  } catch {
    return null;
  }
}

function writeModel(raw: unknown) {
  try {
    localStorage.setItem('lg_classifier_model', JSON.stringify(raw));
    const metricsRaw = localStorage.getItem('guardian_metrics');
    if (metricsRaw) {
      const metrics = JSON.parse(metricsRaw) as GuardianMetrics & { ts?: number };
      if (metrics && typeof metrics === 'object') {
        metrics.ts = Date.now();
        localStorage.setItem('guardian_metrics', JSON.stringify(metrics));
        window.dispatchEvent(new StorageEvent('storage', { key: 'guardian_metrics' }));
      }
    }
  } catch (err) {
    console.warn('[Lumen Guardian] Failed to save model thresholds', err);
  }
}

export function TunerPanel() {
  const modelInfo = React.useMemo(() => readModel(), []);
  const [medium, setMedium] = React.useState(modelInfo?.thresholds.medium ?? 0.7);
  const [high, setHigh] = React.useState(modelInfo?.thresholds.high ?? 0.88);
  const [status, setStatus] = React.useState('');
  const [metrics, setMetrics] = React.useState<GuardianMetrics | null>(null);

  const confusion = React.useMemo(() => {
    if (!metrics?.shadow) return null;
    const shadow = metrics.shadow;
    const total = shadow.total ?? 0;
    const high = shadow.high ?? 0;
    const highNoFast = shadow.highNoFast ?? 0;
    const fastHigher = shadow.fastPathHigher ?? 0;
    const agree = shadow.agree ?? 0;
    const pct = (num: number, denom: number) => {
      if (!denom) return '0%';
      return `${Math.round((num / denom) * 100)}%`;
    };
    const highAgree = high - highNoFast;
    return {
      total,
      high,
      highNoFast,
      fastHigher,
      agree,
      pctHighAgree: pct(highAgree, high),
      pctHighDisagree: pct(highNoFast, high),
      pctFastHigher: pct(fastHigher, total),
    };
  }, [metrics]);

  React.useEffect(() => {
    const sync = () => {
      try {
        const raw = localStorage.getItem('guardian_metrics');
        setMetrics(raw ? (JSON.parse(raw) as GuardianMetrics) : null);
      } catch {
        setMetrics(null);
      }
    };
    sync();
    window.addEventListener('storage', sync);
    const poll = window.setInterval(sync, 2000);
    return () => {
      window.removeEventListener('storage', sync);
      window.clearInterval(poll);
    };
  }, []);

  function save() {
    if (!modelInfo) {
      setStatus('No model found. Train a model first.');
      return;
    }
    const adjustedHigh = Math.max(high, medium + 0.05);
    const next = {
      ...modelInfo.raw,
      thresholds: { medium, high: adjustedHigh },
    };
    writeModel(next);
    setHigh(adjustedHigh);
    setStatus(`Saved thresholds: medium ${medium.toFixed(2)}, high ${adjustedHigh.toFixed(2)}`);
  }

  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
      <h3>Threshold Tuner</h3>
      {!modelInfo && <p>No classifier model stored yet.</p>}
      {modelInfo && (
        <div style={{ display: 'grid', gap: 12 }}>
          <label>
            Medium threshold ({medium.toFixed(2)})
            <input
              type="range"
              min="0.1"
              max="0.95"
              step="0.01"
              value={medium}
              onChange={(e) => setMedium(Number(e.target.value))}
            />
          </label>
          <label>
            High threshold ({high.toFixed(2)})
            <input
              type="range"
              min="0.2"
              max="0.99"
              step="0.01"
              value={high}
              onChange={(e) => setHigh(Number(e.target.value))}
            />
          </label>
          <button onClick={save}>Save thresholds</button>
        </div>
      )}
      {status && <div style={{ marginTop: 8 }}>{renderVal(status)}</div>}
      {confusion && (
        <div style={{ marginTop: 12, fontSize: 14 }}>
          <strong>Shadow metrics:</strong>
          <div>Total evals: {renderVal(confusion.total)}</div>
          <div>
            Classifier HIGH: {renderVal(confusion.high)} ({renderVal(confusion.pctHighAgree)} agree w/fast path)
          </div>
          <div>
            Classifier HIGH only: {renderVal(confusion.highNoFast)} ({renderVal(confusion.pctHighDisagree)} disagree)
          </div>
          <div>
            Fast path higher severity: {renderVal(confusion.fastHigher)} ({renderVal(confusion.pctFastHigher)} of evals)
          </div>
          <div>Overall agreement: {renderVal(confusion.agree)}</div>
        </div>
      )}
    </div>
  );
}
