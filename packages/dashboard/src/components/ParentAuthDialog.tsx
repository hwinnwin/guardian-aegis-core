import React from 'react';
import { __DEV__ } from '../core/env';
import { getFailureState, registerFailure, clearFailures, computeLockoutMs } from '../core/auth-attempts';
import { setUnlockedDeviceKey } from '../services/device-key-cache';
import { generateRecoveryCode, hashRecovery } from '../core/recovery';

type Mode = 'setup' | 'unlock' | 'reset-with-recovery' | 'nuke-reset';

interface Props {
  mode: Mode;
  onCancel(): void;
  onSuccess(deviceKey: CryptoKey | null): void;
}

type View =
  | 'setup'
  | 'unlock'
  | 'show-recovery'
  | 'reset-verify'
  | 'reset-set-pin'
  | 'nuke-confirm';

const encoder = new TextEncoder();

function toBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

function normalizeRecoveryInput(value: string): string {
  const compact = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (compact.length !== 16) return value.trim().toUpperCase();
  return compact.match(/.{1,4}/g)!.join('-');
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

async function deriveParentKey(pin: string, salt: Uint8Array, iterations = 210_000): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export function ParentAuthDialog({ mode, onCancel, onSuccess }: Props) {
  const initialView: View = React.useMemo(() => {
    switch (mode) {
      case 'setup':
        return 'setup';
      case 'unlock':
        return 'unlock';
      case 'reset-with-recovery':
        return 'reset-verify';
      case 'nuke-reset':
        return 'nuke-confirm';
      default:
        return 'unlock';
    }
  }, [mode]);

  const [view, setView] = React.useState<View>(initialView);
  React.useEffect(() => {
    setView(initialView);
    setPin('');
    setConfirmPin('');
    setRecoveryInput('');
    setError(null);
    setRecoveryCode(null);
    setSaved(false);
    setNukeConfirm('');
  }, [initialView]);

  const [pin, setPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [recoveryCode, setRecoveryCode] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [recoveryInput, setRecoveryInput] = React.useState('');
  const [nukeConfirm, setNukeConfirm] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [attemptState, setAttemptState] = React.useState(() => getFailureState());

  const lockoutMs = computeLockoutMs(attemptState);

  function clearGlobalState() {
    clearFailures();
    setUnlockedDeviceKey(null);
    setAttemptState(getFailureState());
  }

  async function performWrap(pinValue: string) {
    if (pinValue.length < 6) throw new Error('PIN must be at least 6 digits');
    if (pinValue !== confirmPin) throw new Error('PINs do not match');

    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const saltB64 = toBase64(saltBytes);
    const code = generateRecoveryCode();
    const hash = await hashRecovery(code, saltB64);

    localStorage.setItem('guardian_pin_setup_pin', pinValue);
    localStorage.setItem('guardian_pin_setup_request', JSON.stringify({ ts: Date.now() }));
    localStorage.setItem('guardian_recovery_salt_request', saltB64);
    localStorage.setItem('guardian_recovery_hash_request', hash);
    window.dispatchEvent(new Event('storage'));

    setRecoveryCode(code);
    setSaved(false);
    setPin('');
    setConfirmPin('');
    setView('show-recovery');
    clearGlobalState();
  }

  async function handleUnlock(pinValue: string) {
    const recordRaw = localStorage.getItem('guardian_wrapped_device_key');
    if (!recordRaw) throw new Error('No wrapped key found. Please set a PIN first.');
    const record = JSON.parse(recordRaw);
    const salt = toBytes(record.saltB64);
    const iv = toBytes(record.ivB64);
    const ciphertext = toBytes(record.wrappedB64);
    const parentKey = await deriveParentKey(pinValue, salt, record.iterations);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, parentKey, ciphertext);
    const jwk = JSON.parse(new TextDecoder().decode(plain));
    const deviceKey = await crypto.subtle.importKey('jwk', jwk, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
    clearGlobalState();
    setUnlockedDeviceKey(deviceKey);
    onSuccess(deviceKey);
  }

  async function verifyRecovery(code: string) {
    const salt = localStorage.getItem('guardian_recovery_salt');
    const hash = localStorage.getItem('guardian_recovery_hash');
    if (!salt || !hash) throw new Error('No recovery data found.');
    const normalized = normalizeRecoveryInput(code);
    const attempt = await hashRecovery(normalized, salt);
    if (attempt !== hash) throw new Error('Recovery code invalid');
    clearFailures();
    setView('reset-set-pin');
    setPin('');
    setConfirmPin('');
  }

  function performNuke() {
    const required = 'ERASE';
    if (nukeConfirm.trim().toUpperCase() !== required) {
      setError(`Type ${required} to confirm.`);
      return;
    }
    const keys = [
      'guardian_wrapped_device_key',
      'guardian_recovery_hash',
      'guardian_recovery_salt',
      'guardian_recovery_hash_request',
      'guardian_recovery_salt_request',
      'guardian_pin_setup_request',
      'guardian_pin_setup_pin',
      'guardian_evidence_store',
      'guardian_parent_alerts',
      'guardian_audit_log',
      'guardian_appeals',
      'guardian_metrics',
    ];
    keys.forEach((key) => localStorage.removeItem(key));
    clearGlobalState();
    setRecoveryCode(null);
    setView('nuke-confirm');
    onSuccess(null);
  }

  async function onSubmit() {
    if (busy || lockoutMs > 0) return;
    setBusy(true);
    setError(null);
    try {
      if (view === 'setup') {
        await performWrap(pin);
      } else if (view === 'unlock') {
        await handleUnlock(pin);
      } else if (view === 'reset-set-pin') {
        await performWrap(pin);
      } else if (view === 'reset-verify') {
        await verifyRecovery(recoveryInput);
      } else if (view === 'nuke-confirm') {
        performNuke();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      const newState = registerFailure();
      setAttemptState(newState);
    } finally {
      setBusy(false);
    }
  }

  React.useEffect(() => {
    if (lockoutMs <= 0) return;
    const timer = window.setTimeout(() => {
      setAttemptState(getFailureState());
    }, lockoutMs);
    return () => window.clearTimeout(timer);
  }, [lockoutMs]);

  function renderContent() {
    switch (view) {
      case 'setup':
      case 'reset-set-pin':
        return (
          <>
            <input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              disabled={busy || lockoutMs > 0}
            />
            <input
              type="password"
              placeholder="Confirm PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              disabled={busy}
            />
          </>
        );
      case 'unlock':
        return (
          <input
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            disabled={busy || lockoutMs > 0}
          />
        );
      case 'reset-verify':
        return (
          <input
            type="text"
            placeholder="Enter recovery code"
            value={recoveryInput}
            onChange={(e) => setRecoveryInput(e.target.value)}
            disabled={busy || lockoutMs > 0}
          />
        );
      case 'nuke-confirm':
        return (
          <>
            <p style={{ margin: '4px 0', color: '#b91c1c' }}>
              This will erase the wrapped key, evidence, alerts, analytics, and appeals. Type <b>ERASE</b> to confirm.
            </p>
            <input
              type="text"
              placeholder="Type ERASE to confirm"
              value={nukeConfirm}
              onChange={(e) => setNukeConfirm(e.target.value)}
            />
          </>
        );
      case 'show-recovery':
        return (
          <>
            <p style={{ margin: '4px 0' }}>Save this recovery code. You will need it to reset your PIN:</p>
            <div style={{ fontFamily: 'monospace', fontSize: 18, background: '#111', color: '#fff', padding: 8, borderRadius: 6 }}>
              {recoveryCode}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} /> I saved this recovery code.
            </label>
          </>
        );
      default:
        return null;
    }
  }

  const primaryLabel = (() => {
    switch (view) {
      case 'setup':
        return 'Save PIN';
      case 'unlock':
        return 'Unlock';
      case 'reset-verify':
        return 'Verify code';
      case 'reset-set-pin':
        return 'Save new PIN';
      case 'nuke-confirm':
        return 'Erase everything';
      case 'show-recovery':
        return 'Done';
      default:
        return 'Continue';
    }
  })();

  const primaryDisabled =
    busy ||
    (lockoutMs > 0 && view !== 'show-recovery' && view !== 'nuke-confirm') ||
    (view === 'show-recovery' && !saved) ||
    (view === 'nuke-confirm' && nukeConfirm.trim().toUpperCase() !== 'ERASE') ||
    ((view === 'setup' || view === 'reset-set-pin') && pin.length < 6);

  function handlePrimaryClick() {
    if (view === 'show-recovery') {
      clearGlobalState();
      onSuccess(null);
      return;
    }
    onSubmit();
  }

  return (
    <div style={{ padding: 16, background: '#fff', border: '1px solid #eee', borderRadius: 8, maxWidth: 380 }}>
      <h3 style={{ marginTop: 0 }}>
        {view === 'setup' && 'Set Parent PIN'}
        {view === 'unlock' && 'Parent Unlock'}
        {view === 'reset-verify' && 'Reset with Recovery Code'}
        {view === 'reset-set-pin' && 'Set New PIN'}
        {view === 'show-recovery' && 'Recovery Code'}
        {view === 'nuke-confirm' && 'Erase Guardian Data'}
      </h3>
      <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>{renderContent()}</div>
      {lockoutMs > 0 && view !== 'show-recovery' && view !== 'nuke-confirm' && (
        <small style={{ color: '#b91c1c', display: 'block', marginTop: 8 }}>
          Too many attempts. Wait {Math.ceil(lockoutMs / 1000)}s.
        </small>
      )}
      {error && <small style={{ color: '#b91c1c', display: 'block', marginTop: 8 }}>{error}</small>}
      <div style={{ marginTop: 12 }}>
        <button onClick={handlePrimaryClick} disabled={primaryDisabled}>
          {primaryLabel}
        </button>
        <button onClick={onCancel} style={{ marginLeft: 8 }}>Cancel</button>
      </div>
      {__DEV__ && <small style={{ display: 'block', opacity: 0.7, marginTop: 8 }}>(DEV mode enabled)</small>}
    </div>
  );
}
