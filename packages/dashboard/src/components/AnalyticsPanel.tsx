import React from 'react';

const STORAGE_KEY = 'guardian_metrics';

export function AnalyticsPanel() {
  const [metrics, setMetrics] = React.useState<any | null>(null);

  React.useEffect(() => {
    const sync = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        setMetrics(raw ? JSON.parse(raw) : null);
      } catch {
        setMetrics(null);
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === STORAGE_KEY) {
        sync();
      }
    };

    sync();
    window.addEventListener('storage', onStorage);
    const poll = window.setInterval(sync, 1500);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.clearInterval(poll);
    };
  }, []);

  if (!metrics) {
    return <div>Analytics: no data yet</div>;
  }

  let modelAge = 'unknown';
  const shadow = metrics.shadow ?? {};
  try {
    const modelRaw = localStorage.getItem('lg_classifier_model');
    if (modelRaw) {
      const parsed = JSON.parse(modelRaw);
      const createdAt = parsed?.createdAt;
      if (typeof createdAt === 'number') {
        const minutes = Math.round((Date.now() - createdAt) / 60000);
        modelAge = minutes >= 0 ? `${minutes} min ago` : 'just now';
      }
    }
  } catch {
    modelAge = 'unknown';
  }

  const stats = [
    { label: 'Detections', value: metrics.detections },
    { label: 'Blocks', value: metrics.blocks },
    { label: 'Critical', value: metrics.critical },
    { label: 'Advisories', value: metrics.advisories },
    { label: 'Appeals', value: metrics.appeals },
    { label: 'TTB p95 (ms)', value: metrics.ttb?.p95 ?? 0 },
    { label: 'Shadow Total', value: shadow.total ?? 0 },
    { label: 'Shadow High', value: shadow.high ?? 0 },
    { label: 'Shadow Medium', value: shadow.medium ?? 0 },
    { label: 'Shadow Agreement', value: shadow.agree ?? 0 },
    { label: 'Shadow High Only', value: shadow.highNoFast ?? 0 },
    { label: 'Shadow Fast>Classifier', value: shadow.fastPathHigher ?? 0 },
    {
      label: 'Shadow Prob p95',
      value: typeof shadow.prob?.p95 === 'number' ? shadow.prob.p95.toFixed(2) : '0.00',
    },
    {
      label: 'Shadow Prob Avg',
      value: typeof shadow.prob?.avg === 'number' ? shadow.prob.avg.toFixed(2) : '0.00',
    },
    { label: 'Shadow Samples', value: shadow.prob?.samples ?? 0 },
    { label: 'Rule Compile Errors', value: metrics.rulesCompileErrors ?? 0 },
  ];

  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
      <h3 style={{ margin: '0 0 12px' }}>Analytics</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12 }}>
        {stats.map((stat) => (
          <Stat key={stat.label} label={stat.label} value={stat.value} />
        ))}
        <Stat label="Model age" value={modelAge} />
      </div>
      <small style={{ display: 'block', opacity: 0.7, marginTop: 8 }}>
        Updated: {new Date(metrics.ts ?? Date.now()).toLocaleTimeString()}
      </small>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ padding: 10, background: '#fafafa', borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: '#555' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{String(value)}</div>
    </div>
  );
}
