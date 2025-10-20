import React from 'react';
import rulesYaml from '../../../extension/src/detection/rules.fast.yaml?raw';
import { loadRules, detectFastPath } from '../../../extension/src/detection/engine';
import { emojiHints } from '../../../extension/src/detection/normalize';

let loaded = false;

export function RuleSimulator() {
  const [text, setText] = React.useState('');
  const [folded, setFolded] = React.useState('');
  const [hits, setHits] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!loaded) {
      loadRules(rulesYaml);
      loaded = true;
    }
  }, []);

  function run() {
    const hint = emojiHints(text);
    setFolded(hint);
    setHits(detectFastPath(text));
  }

  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
      <h3 style={{ margin: '0 0 12px' }}>Rule Simulator</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a message…"
        style={{ width: '100%', height: 120, font: '14px/1.4 system-ui', marginBottom: 8 }}
      />
      <div>
        <button onClick={run}>Detect</button>
      </div>
      {hits.length > 0 && (
        <pre style={{ background: '#fafafa', padding: 8, borderRadius: 6, marginTop: 8 }}>
{JSON.stringify({ folded, hits }, null, 2)}
        </pre>
      )}
    </div>
  );
}
