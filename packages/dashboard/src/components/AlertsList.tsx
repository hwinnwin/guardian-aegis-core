import React from 'react';
import { getAlerts } from '../api/alerts.local';
import { UnlockDialog } from './UnlockDialog';
import { ParentAuthDialog } from './ParentAuthDialog';
import { setUnlockedDeviceKey } from '../services/device-key-cache';

export function AlertsList() {
  const [alerts, setAlerts] = React.useState<any[]>([]);
  const [unlockId, setUnlockId] = React.useState<string | null>(null);
  const [authMode, setAuthMode] = React.useState<'setup' | 'unlock' | 'reset-with-recovery' | 'nuke-reset' | null>(null);
  const [deviceKey, setDeviceKey] = React.useState<CryptoKey | null>(null);

  React.useEffect(() => {
    const sync = () => setAlerts(getAlerts());
    const onAlert = () => sync();
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === 'guardian_parent_alerts' || event.key === 'guardian_evidence_store') {
        sync();
      }
    };

    sync();
    window.addEventListener('guardian:parent-alert', onAlert as EventListener);
    window.addEventListener('guardian:dev-key-ready', onAlert as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('guardian:parent-alert', onAlert as EventListener);
      window.removeEventListener('guardian:dev-key-ready', onAlert as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <button onClick={() => setAuthMode('setup')}>Set Parent PIN</button>
        <button onClick={() => setAuthMode('unlock')}>Unlock (enter PIN)</button>
        <button onClick={() => setAuthMode('reset-with-recovery')}>Reset with Recovery</button>
        <button onClick={() => setAuthMode('nuke-reset')}>Erase & Reset</button>
        <h2 style={{ margin: '0 0 0 auto' }}>Guardian Alerts</h2>
      </div>
      <ul>
        {alerts
          .slice()
          .reverse()
          .map((alert) => (
            <li key={alert.id} style={{ marginBottom: 8 }}>
              <strong>{alert.severity}</strong> — {alert.headline}
              {alert.label && (
                <em style={{ marginLeft: 6, opacity: 0.8 }}>
                  [{alert.label}
                  {Array.isArray(alert.reasons) ? ` · ${alert.reasons.length}` : ''}]
                </em>
              )}{' '}
              <small>({new Date(alert.createdAt).toLocaleString()})</small>
              <button style={{ marginLeft: 8 }} onClick={() => setUnlockId(alert.evidenceId)}>
                Unlock
              </button>
            </li>
          ))}
      </ul>
      {unlockId && (
        <UnlockDialog evidenceId={unlockId} deviceKey={deviceKey} onClose={() => setUnlockId(null)} />
      )}
      {authMode && (
        <ParentAuthDialog
          mode={authMode}
          onCancel={() => setAuthMode(null)}
          onSuccess={(key) => {
            setAuthMode(null);
            if (key) {
              setUnlockedDeviceKey(key);
              setDeviceKey(key);
            } else {
              setUnlockedDeviceKey(null);
              setDeviceKey(null);
            }
          }}
        />
      )}
    </div>
  );
}
