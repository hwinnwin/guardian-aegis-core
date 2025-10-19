import React from 'react';
import yaml from 'js-yaml';
import rulesRaw from '../../../extension/src/detection/rules.fast.yaml?raw';

interface RuleSchema {
  version: string;
  labels: Record<string, {
    severity: string;
    patterns: { src: string; name?: string; notes?: string }[];
    negatives?: string[];
  }>;
}

const doc = yaml.load(rulesRaw) as RuleSchema;

export function RuleInspector() {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
      <h3>Rule Inspector</h3>
      {Object.entries(doc.labels ?? {}).map(([label, config]) => (
        <div key={label} style={{ marginBottom: 12 }}>
          <strong>{label}</strong> — {config.severity}
          <ul>
            {(config.patterns ?? []).map((pattern, idx) => (
              <li key={idx}>
                <div><code>{pattern.name ?? 'pattern'}</code></div>
                <div style={{ fontSize: 12, color: '#555' }}>{pattern.src}</div>
                {pattern.notes && <div style={{ fontSize: 12, color: '#777' }}>Notes: {pattern.notes}</div>}
              </li>
            ))}
          </ul>
          {config.negatives && config.negatives.length > 0 && (
            <small style={{ display: 'block', color: '#555' }}>Negatives: {config.negatives.join(', ')}</small>
          )}
        </div>
      ))}
    </div>
  );
}
