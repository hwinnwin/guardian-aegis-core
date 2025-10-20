import React from 'react';
import rulesRaw from '../../../extension/src/detection/rules.fast.yaml?raw';
import { loadRules, detectFastPath } from '../../../extension/src/detection/engine';
import { classifyAdvisoryWithScore } from '../../../extension/src/detection/decide';

const KEYWORDS = ['telegram', 'whatsapp', 'snap', 'signal', 'text me', 'phone number', 'keep this between us'];

let rulesLoaded = false;

function ensureRulesLoaded() {
  if (!rulesLoaded) {
    loadRules(rulesRaw);
    rulesLoaded = true;
  }
}

function readModel() {
  try {
    const raw = localStorage.getItem('lg_classifier_model');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    parsed.weights = new Float32Array(parsed.weights ?? []);
    return parsed;
  } catch {
    return null;
  }
}

interface Summary {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  bins: Record<string, { total: number; pos: number; neg: number }>;
  fastPathHigh: number;
  fastPathMedium: number;
  classifierHigh: number;
  classifierMedium: number;
}

const BIN_SIZE = 0.1;

function initSummary(): Summary {
  return {
    tp: 0,
    fp: 0,
    fn: 0,
    tn: 0,
    bins: {},
    fastPathHigh: 0,
    fastPathMedium: 0,
    classifierHigh: 0,
    classifierMedium: 0,
  };
}

function rankSeverity(severity: string | undefined): number {
  switch (severity) {
    case 'CRITICAL':
      return 4;
    case 'HIGH':
      return 3;
    case 'MEDIUM':
      return 2;
    case 'LOW':
      return 1;
    default:
      return 0;
  }
}

export function CorpusRunner() {
  const [pos, setPos] = React.useState('');
  const [neg, setNeg] = React.useState('');
  const [summary, setSummary] = React.useState<Summary | null>(null);

  React.useEffect(() => {
    ensureRulesLoaded();
  }, []);

  function run() {
    const model = readModel();
    const summary = initSummary();

    function score(text: string, expected: 0 | 1) {
      if (!text) return;
      const fast = detectFastPath(text);
      const fastLevel = fast.reduce((highest, current) => {
        if (rankSeverity(current.severity) > rankSeverity(highest)) {
          return current.severity;
        }
        return highest;
      }, 'NONE');
      const { level: lvl, prob } = classifyAdvisoryWithScore(text, model, KEYWORDS);
      const binLabel = (Math.floor(prob / BIN_SIZE) * BIN_SIZE).toFixed(1);
      summary.bins[binLabel] = summary.bins[binLabel] ?? { total: 0, pos: 0, neg: 0 };
      summary.bins[binLabel].total += 1;
      if (expected === 1) summary.bins[binLabel].pos += 1;
      else summary.bins[binLabel].neg += 1;

      const fastHigh = fastLevel === 'HIGH' || fastLevel === 'CRITICAL';
      if (fastHigh) summary.fastPathHigh += 1;
      if (fastLevel === 'MEDIUM') summary.fastPathMedium += 1;
      if (lvl === 'HIGH') summary.classifierHigh += 1;
      if (lvl === 'MEDIUM') summary.classifierMedium += 1;

      if (expected === 1) {
        if (fastHigh || lvl === 'HIGH' || lvl === 'MEDIUM') summary.tp += 1;
        else summary.fn += 1;
      } else {
        if (fastHigh || lvl === 'HIGH' || lvl === 'MEDIUM') summary.fp += 1;
        else summary.tn += 1;
      }
    }

    pos.split('\n').forEach((line) => score(line.trim(), 1));
    neg.split('\n').forEach((line) => score(line.trim(), 0));
    setSummary(summary);
  }

  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
      <h3>Corpus Runner</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <strong>Positive corpus</strong>
          <textarea value={pos} onChange={(e) => setPos(e.target.value)} style={{ width: '100%', height: 120 }} />
        </div>
        <div>
          <strong>Negative corpus</strong>
          <textarea value={neg} onChange={(e) => setNeg(e.target.value)} style={{ width: '100%', height: 120 }} />
        </div>
      </div>
      <button onClick={run} style={{ marginTop: 8 }}>Run evaluation</button>
      {summary && (
        <div style={{ marginTop: 12 }}>
          <div>TP: {summary.tp} | FP: {summary.fp} | FN: {summary.fn} | TN: {summary.tn}</div>
          <div style={{ marginTop: 8 }}>
            <strong>Channels</strong>
            <div>Fast-path HIGH/CRIT: {summary.fastPathHigh}</div>
            <div>Fast-path MEDIUM advisories: {summary.fastPathMedium}</div>
            <div>Classifier HIGH suggestions: {summary.classifierHigh}</div>
            <div>Classifier MEDIUM suggestions: {summary.classifierMedium}</div>
          </div>
          <div style={{ marginTop: 8 }}>
            <strong>Probability bins</strong>
            <ul>
              {Object.entries(summary.bins)
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([bin, counts]) => (
                  <li key={bin}>
                    {bin} → total {counts.total} (pos {counts.pos} / neg {counts.neg})
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
