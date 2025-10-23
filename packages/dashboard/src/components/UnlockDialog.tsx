import React from 'react';
import { getEvidenceById } from '../api/evidence.local';
import { decryptEvidence } from '../services/decrypt.service';
import { addAudit } from '../api/audit.local';
import { getAlertByEvidenceId, type ParentAlert } from '../api/alerts.local';
import { annotateInteractions, type MatchAnnotation, type InteractionLike } from '../services/highlight';
import { __DEV__ } from '../core/env';
import { getUnlockedDeviceKey } from '../services/device-key-cache';
import { renderVal } from './_renderVal';

type EvidenceInteraction = {
  timestamp?: number | string;
  data?: Record<string, unknown> | null;
  text?: string;
  [key: string]: unknown;
};

interface UnlockedEvidence {
  interactions?: EvidenceInteraction[];
  [key: string]: unknown;
}

const isEvidenceInteraction = (value: unknown): value is EvidenceInteraction => {
  return Boolean(value && typeof value === 'object');
};

const toInteractionLike = (interaction: EvidenceInteraction): InteractionLike => {
  const rawTimestamp = (() => {
    if (typeof interaction.timestamp === 'number') {
      return Number.isFinite(interaction.timestamp) ? interaction.timestamp : NaN;
    }
    if (typeof interaction.timestamp === 'string') {
      const parsed = Date.parse(interaction.timestamp);
      return Number.isFinite(parsed) ? parsed : NaN;
    }
    return NaN;
  })();
  const timestamp = Number.isFinite(rawTimestamp) ? rawTimestamp : 0;

  const data =
    interaction.data && typeof interaction.data === 'object'
      ? interaction.data
      : typeof interaction.text === 'string'
        ? { text: interaction.text }
        : undefined;

  return {
    timestamp,
    data: data ?? undefined,
  };
};

const isUnlockedEvidence = (value: unknown): value is UnlockedEvidence => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (candidate.interactions === undefined) {
    return true;
  }
  if (!Array.isArray(candidate.interactions)) {
    return false;
  }
  return candidate.interactions.every(isEvidenceInteraction);
};

const toReasonPatterns = (alert: ParentAlert | undefined): string[] => {
  if (!alert?.reasons) {
    return [];
  }
  return alert.reasons
    .map((reason) => {
      if (typeof reason === 'string') return reason;
      if (reason && typeof reason === 'object' && typeof reason.label === 'string') {
        return reason.label;
      }
      return null;
    })
    .filter((pattern): pattern is string => Boolean(pattern));
};

export function UnlockDialog({ evidenceId, onClose, deviceKey }: { evidenceId: string; onClose(): void; deviceKey?: CryptoKey | null }) {
  const [reason, setReason] = React.useState('');
  const [data, setData] = React.useState<UnlockedEvidence | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const alert = React.useMemo<ParentAlert | undefined>(() => getAlertByEvidenceId(evidenceId), [evidenceId]);
  const [annotations, setAnnotations] = React.useState<MatchAnnotation[] | null>(null);
  const activeDeviceKey = deviceKey ?? getUnlockedDeviceKey();
  const wrappedExists = Boolean(localStorage.getItem('guardian_wrapped_device_key'));

  async function onUnlock() {
    setBusy(true);
    setError(null);
    try {
      const packet = getEvidenceById(evidenceId);
      if (!packet) throw new Error('Evidence not found');
      if (!__DEV__ && wrappedExists && !activeDeviceKey) {
        throw new Error('Parent PIN required. Use Unlock before viewing evidence.');
      }
      const payload = await decryptEvidence(packet.sealed, activeDeviceKey ?? undefined);
      if (!isUnlockedEvidence(payload)) {
        throw new Error('Unexpected evidence payload format');
      }
      const interactions = Array.isArray(payload.interactions)
        ? payload.interactions.filter(isEvidenceInteraction)
        : [];
      setData({ ...payload, interactions });
      setAnnotations(annotateInteractions(interactions.map(toInteractionLike), toReasonPatterns(alert)));

      addAudit({
        id: `audit_${Date.now()}`,
        ts: Date.now(),
        action: 'UNLOCK',
        evidenceId,
        reason,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#fff', marginTop: 16 }}>
      <h3>Unlock Evidence</h3>
      {alert && (
        <div
          style={{
            margin: '8px 0',
            padding: '8px',
            background: '#f9fafb',
            border: '1px solid #eee',
            borderRadius: 6,
          }}
        >
          <strong>Why blocked:</strong>{' '}
          <span>{renderVal(alert.label ?? alert.headline)}</span>
          {Array.isArray(alert.reasons) && alert.reasons.length > 0 && (
            <ul style={{ margin: '6px 0 0 16px' }}>
              {alert.reasons.map((r: string, i: number) => (
                <li key={i}>
                  <code>{renderVal(r)}</code>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {!data && (
        <>
          <label htmlFor="guardian-unlock-reason">Reason for viewing:</label>
          <input
            id="guardian-unlock-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ width: '100%', margin: '8px 0', padding: '6px 8px' }}
            placeholder="e.g. Following up on alert"
          />
          <div>
            <button onClick={onUnlock} disabled={!reason.trim() || busy}>
              {busy ? 'Unlocking…' : 'Unlock'}
            </button>
            <button onClick={onClose} style={{ marginLeft: 8 }}>
              Cancel
            </button>
          </div>
          {error && <p style={{ color: 'crimson', marginTop: 8 }}>{error}</p>}
        </>
      )}

      {data && (
        <>
          <h4 style={{ marginTop: 16 }}>Decrypted Evidence</h4>
          <pre
            style={{
              maxHeight: 220,
              overflow: 'auto',
              border: '1px solid #eee',
              borderRadius: 8,
              padding: 8,
              background: '#f9fafb',
              fontSize: 12,
            }}
          >
            {JSON.stringify(data, null, 2)}
          </pre>
          <div
            style={{
              maxHeight: 320,
              overflow: 'auto',
              border: '1px solid #eee',
              borderRadius: 8,
            }}
          >
            {(data.interactions ?? []).map((interaction, index) => {
              const annotation = annotations?.[index];
              const matched = annotation?.matched ?? false;
              const matchedBy = Array.isArray(annotation?.matchedBy) ? annotation?.matchedBy ?? [] : [];
              const timestamp =
                typeof interaction.timestamp === 'number'
                  ? new Date(interaction.timestamp).toLocaleString()
                  : interaction.timestamp
                    ? new Date(interaction.timestamp).toLocaleString()
                : 'Unknown time';
              const text =
                typeof interaction.data === 'object' && interaction.data !== null && 'text' in interaction.data
                  ? String((interaction.data as Record<string, unknown>).text ?? '')
                  : typeof interaction.text === 'string'
                    ? interaction.text
                    : JSON.stringify(interaction.data ?? interaction, null, 2);

              return (
                <div
                  key={index}
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #f2f2f2',
                    background: matched ? '#fff7ed' : '#fff',
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {matched ? (
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: 6,
                          fontSize: 12,
                          background: '#fb923c',
                          color: '#111827',
                          fontWeight: 600,
                        }}
                      >
                        MATCH
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: 6,
                          fontSize: 12,
                          background: '#e5e7eb',
                          color: '#374151',
                        }}
                      >
                        context
                      </span>
                    )}
                    <small style={{ color: '#6b7280' }}>{timestamp}</small>
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      filter: matched ? 'none' : 'blur(2px)',
                      opacity: matched ? 1 : 0.9,
                      transition: 'filter .2s',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {text}
                  </div>
                  {matched && matchedBy.length > 0 ? (
                    <div style={{ marginTop: 6 }}>
                      <small style={{ color: '#6b7280' }}>Matched by:</small>
                      <ul style={{ margin: '4px 0 0 16px' }}>
                        {matchedBy.map((rule, i) => (
                          <li key={i}>
                            <code>{renderVal(rule)}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <button onClick={onClose}>Close</button>
        </>
      )}
    </div>
  );
}
