import React from 'react';
import { train, TrainSample } from '../workers/lg-trainer';
import { renderVal } from './_renderVal';

const KEYWORDS = ['telegram', 'whatsapp', 'snap', 'signal', 'text me', 'phone number', 'keep this between us'];

function readAppeals(): TrainSample[] {
  try {
    const records = JSON.parse(localStorage.getItem('guardian_appeals') ?? '[]');
    return (Array.isArray(records) ? records : [])
      .map((entry: any) => ({ text: entry?.sample?.text ?? '', label: 0 as const }))
      .filter((sample) => sample.text);
  } catch {
    return [];
  }
}

export function TrainerPanel() {
  const [pos, setPos] = React.useState('');
  const [neg, setNeg] = React.useState('');
  const [status, setStatus] = React.useState('');

  React.useEffect(() => {
    setPos("let's switch to telegram\nsend me your phone number\nkeep this between us");
    setNeg('telegram update notes\nphone camera review\nmom said dinner at 6');
  }, []);

  function runTrain() {
    const samples: TrainSample[] = [];
    pos
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => samples.push({ text: line, label: 1 }));
    neg
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => samples.push({ text: line, label: 0 }));
    readAppeals().forEach((sample) => samples.push(sample));

    if (!samples.length) {
      setStatus('Provide positive and negative samples first.');
      return;
    }

    const model = train(samples, { dim: 4096, lr: 0.1, l2: 1e-4, epochs: 3, kw: KEYWORDS });
    const json = { ...model, weights: Array.from(model.weights) };
    localStorage.setItem('lg_classifier_model', JSON.stringify(json));
    try {
      const metricsRaw = localStorage.getItem('guardian_metrics');
      if (metricsRaw) {
        const metrics = JSON.parse(metricsRaw);
        metrics.ts = Date.now();
        localStorage.setItem('guardian_metrics', JSON.stringify(metrics));
        window.dispatchEvent(new StorageEvent('storage', { key: 'guardian_metrics' } as any));
      }
    } catch {
      // ignore
    }
    setStatus(`Trained ${samples.length} samples at ${new Date(model.createdAt).toLocaleString()}`);
  }

  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
      <h3>Layer-1 Classifier Trainer</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <strong>Positive samples</strong>
          <textarea value={pos} onChange={(e) => setPos(e.target.value)} style={{ width: '100%', height: 140 }} />
        </div>
        <div>
          <strong>Negative samples</strong>
          <textarea value={neg} onChange={(e) => setNeg(e.target.value)} style={{ width: '100%', height: 140 }} />
        </div>
      </div>
      <button onClick={runTrain} style={{ marginTop: 8 }}>Train &amp; Save Model</button>
      {status && <div style={{ marginTop: 8 }}>{renderVal(status)}</div>}
    </div>
  );
}
