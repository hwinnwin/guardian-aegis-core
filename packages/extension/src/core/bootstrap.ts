import '../core/lockdown.css';
import { RollingBuffer } from '../../../buffer/src/core/rolling-buffer';
import type { Interaction, Platform } from '../../../buffer/src/types';
import rulesYaml from '../detection/rules.fast.yaml?raw';
import { loadRules, detectFastPath } from '../detection/engine';
import { shouldSuppress } from '../detection/cooldown';
import { __DEV__, __SHADOW__ } from './env';
import { getOrCreateDeviceKey, exportDeviceKeyJWKForDev } from './device-key';
import { addAppeal } from '../services/appeal.store';
import { inc } from '../detection/metrics';
import { publishMetrics, pushShadowEval } from '../services/telemetry.store';
import { EvidenceService } from '../services/evidence.service';
import { LocalAlertsSink } from '../services/alerts.service';
import { LockdownService } from '../services/lockdown.service';
import { ActionRouter } from '../services/action-router.service';
import { blockNow } from './block-ui';
import { handlePinSetupRequest, handleRecoveryBridge } from './pin-setup';
import { ensureOnboardingBanner } from '../ui/onboarding';
import { getModel } from '../detection/classifier';
import { AdvisoryLevel, classifyAdvisoryWithScore } from '../detection/decide';

const buffer = new RollingBuffer({
  maxInteractions: 256,
  maxDurationMs: 10_000,
  cleanupIntervalMs: 1_000,
});

const router = new ActionRouter({
  buffer,
  evidence: new EvidenceService({ getDeviceKey: getOrCreateDeviceKey }),
  alerts: new LocalAlertsSink(),
  lockdown: new LockdownService(),
  blockNow,
});

loadRules(rulesYaml);

(async () => {
  await getOrCreateDeviceKey();
  if (__DEV__) {
    try {
      const jwk = await exportDeviceKeyJWKForDev();
      if (jwk) {
        localStorage.setItem('guardian_dev_device_key_jwk', JSON.stringify(jwk));
        window.dispatchEvent(new Event('guardian:dev-key-ready'));
      }
    } catch (err) {
      console.warn('[Guardian] Failed to expose dev device key', err);
    }
  }
})();

window.addEventListener('storage', (event) => {
  if (!event || event.key === null) {
    void handlePinSetupRequest();
    handleRecoveryBridge();
    return;
  }

  if (event.key === 'guardian_pin_setup_request') {
    void handlePinSetupRequest();
  } else if (event.key === 'guardian_recovery_hash_request') {
    handleRecoveryBridge();
  }
});

void handlePinSetupRequest();
handleRecoveryBridge();
ensureOnboardingBanner();

export function onDetection(
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  reason?: string,
  ctx?: { label?: string; reasons?: string[]; senderId?: string }
) {
  router.onDetection(severity, reason, ctx).catch(console.error);
}

export interface NewTurnOptions {
  id?: string;
  senderId?: string;
  senderName?: string;
  platform?: Platform;
  timestamp?: number;
  recipient?: Interaction['recipient'];
  metadata?: Interaction['metadata'];
}

export function onNewTurn(text: string, options: NewTurnOptions = {}) {
  const {
    id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}`,
    senderId = 'unknown-sender',
    senderName = 'Unknown',
    platform = 'generic',
    timestamp = Date.now(),
    recipient,
    metadata,
  } = options;

  const interaction: Interaction = {
    id,
    text,
    sender: { id: senderId, name: senderName },
    recipient,
    platform,
    timestamp,
    metadata,
  };

  buffer.capture(interaction);
}

const COOLDOWN_MS = 20_000;
const CLASSIFIER_KEYWORDS = [
  'telegram',
  'whatsapp',
  'snap',
  'signal',
  'text me',
  'phone number',
  'keep this between us',
  "don't tell your parents",
];

export function onIncomingMessage(
  text: string,
  timestamp: number = Date.now(),
  opts?: { senderId?: string }
) {
  onNewTurn(text, { timestamp, senderId: opts?.senderId });
  const results = detectFastPath(text);
  let handledHigh = false;
  let fastPathLevel: AdvisoryLevel = 'NONE';
  let finalLevel: AdvisoryLevel = 'NONE';
  const model = getModel();
  let classifierComputed = false;
  let classifierSuggestion: { level: AdvisoryLevel; prob: number } = { level: 'NONE', prob: 0 };

  const ensureClassifier = () => {
    if (!classifierComputed) {
      classifierSuggestion = classifyAdvisoryWithScore(text, model, CLASSIFIER_KEYWORDS);
      classifierComputed = true;
    }
    return classifierSuggestion;
  };

  for (const result of results) {
    if (result.severity === 'HIGH' || result.severity === 'CRITICAL') {
      if (!shouldSuppress(timestamp, COOLDOWN_MS, opts?.senderId, result.label, result.severity)) {
        handledHigh = true;
        fastPathLevel = result.severity as AdvisoryLevel;
        onDetection(result.severity, result.label, {
          label: result.label,
          reasons: result.reasons,
          patternSources: result.sources,
          senderId: opts?.senderId,
          messageTs: timestamp,
        });
        finalLevel = result.severity as AdvisoryLevel;
      }
      break;
    } else {
      if (!shouldSuppress(timestamp, COOLDOWN_MS, opts?.senderId, result.label, result.severity)) {
        if (result.severity === 'MEDIUM') {
          inc('detections');
          finalLevel = 'MEDIUM';
        } else if (result.severity === 'LOW') {
          finalLevel = finalLevel === 'NONE' ? 'LOW' : finalLevel;
        }
        fastPathLevel = result.severity as AdvisoryLevel;
        router.onAdvisory(result.severity as 'LOW' | 'MEDIUM', { label: result.label });
      }
    }
  }

  if (!handledHigh) {
    const { level } = ensureClassifier();
    if (level === 'HIGH') {
      if (!shouldSuppress(timestamp, COOLDOWN_MS, opts?.senderId, 'ml_layer1', 'HIGH')) {
        inc('detections');
        onDetection('HIGH', 'ml_layer1', {
          label: 'ml_layer1',
          reasons: ['prob>=threshold'],
          patternSources: ['ml_layer1'],
          senderId: opts?.senderId,
          messageTs: timestamp,
        });
        finalLevel = 'HIGH';
      }
    } else if (level === 'MEDIUM') {
      if (!shouldSuppress(timestamp, COOLDOWN_MS, opts?.senderId, 'ml_layer1', 'MEDIUM')) {
        inc('detections');
        router.onAdvisory('MEDIUM', { label: 'ml_layer1' });
        finalLevel = finalLevel === 'NONE' ? 'MEDIUM' : finalLevel;
      }
    }

  }

  if (__SHADOW__) {
    const { level, prob } = ensureClassifier();
    const comparedFastPath = fastPathLevel === 'NONE' ? finalLevel : fastPathLevel;
    pushShadowEval({
      level,
      fastPath: comparedFastPath,
      prob,
      ts: timestamp,
      textLen: text?.length ?? 0,
    });
  }
}

window.addEventListener('guardian:appeal', (event: Event) => {
  const detail = (event as CustomEvent)?.detail ?? {};
  const label = typeof detail.label === 'string' ? detail.label : 'unknown';
  const latest = buffer.peek().slice(-1)[0];
  const sampleText = latest?.text ?? latest?.data?.text ?? '';
  addAppeal({
    id: `appeal_${Date.now()}`,
    ts: Date.now(),
    label,
    sample: { text: sampleText },
  });
  inc('appeals');
  publishMetrics();
});

export function shutdown() {
  buffer.destroy();
}

export const services = {
  buffer,
  router,
};
