import React from 'react';
import { renderVal } from './_renderVal';

const STORAGE_KEY = 'guardian_metrics';

type ShadowProbMetrics = {
  p95?: number;
  avg?: number;
  samples?: number;
};

type ShadowMetrics = {
  total?: number;
  high?: number;
  medium?: number;
  agree?: number;
  highNoFast?: number;
  fastPathHigher?: number;
  prob?: ShadowProbMetrics;
};

type TimeToBlockMetrics = {
  p50?: number;
  p95?: number;
  samples?: number;
};

interface GuardianMetrics {
  detections?: number;
  blocks?: number;
  critical?: number;
  advisories?: number;
  appeals?: number;
  ttb?: TimeToBlockMetrics;
  shadow?: ShadowMetrics;
  rulesCompileErrors?: number;
  ts?: number;
}

export function AnalyticsPanel() {
  const [metrics, setMetrics] = React.useState<GuardianMetrics | null>(null);

  React.useEffect(() => {
    const sync = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        setMetrics(raw ? (JSON.parse(raw) as GuardianMetrics) : null);
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

  const tsText = metrics?.ts ? new Date(metrics.ts).toLocaleTimeString() : '—';

  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
      <h3 style={{ margin: '0 0 12px' }}>Analytics</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12 }}>
        <Stat label="Detections" value={metrics.detections} />
        <Stat label="Blocks" value={metrics.blocks} />
        <Stat label="Critical" value={metrics.critical} />
        <Stat label="Advisories" value={metrics.advisories} />
        <Stat label="Appeals" value={metrics.appeals} />
        <Stat label="TTB p50 (ms)" value={metrics.ttb?.p50 ?? 0} />
        <Stat label="TTB p95 (ms)" value={metrics.ttb?.p95 ?? 0} />
        <Stat label="TTB samples" value={metrics.ttb?.samples ?? 0} />
        <Stat label="Shadow Total" value={shadow.total ?? 0} />
        <Stat label="Shadow High" value={shadow.high ?? 0} />
        <Stat label="Shadow Medium" value={shadow.medium ?? 0} />
        <Stat label="Shadow Agreement" value={shadow.agree ?? 0} />
        <Stat label="Shadow High Only" value={shadow.highNoFast ?? 0} />
        <Stat label="Shadow Fast>Classifier" value={shadow.fastPathHigher ?? 0} />
        <Stat
          label="Shadow Prob p95"
          value={typeof shadow.prob?.p95 === 'number' ? shadow.prob.p95.toFixed(2) : '0.00'}
        />
        <Stat
          label="Shadow Prob Avg"
          value={typeof shadow.prob?.avg === 'number' ? shadow.prob.avg.toFixed(2) : '0.00'}
        />
        <Stat label="Shadow Samples" value={shadow.prob?.samples ?? 0} />
        <Stat label="Rule Compile Errors" value={metrics.rulesCompileErrors ?? 0} />
        <Stat label="Model age" value={modelAge} />
      </div>
      <small style={{ display: 'block', opacity: 0.7, marginTop: 8 }}>Updated: {tsText}</small>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: unknown }) {
  return (
    <div style={{ padding: 10, background: '#fafafa', borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: '#555' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{renderVal(value)}</div>
    </div>
  );
}
