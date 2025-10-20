import { getOrCreateDeviceKey } from './device-key';
import { wrapDeviceKeyWithPIN, migrateDevKeyToWrapped } from './keybag';

export async function handlePinSetupRequest() {
  const req = localStorage.getItem('guardian_pin_setup_request');
  const pin = localStorage.getItem('guardian_pin_setup_pin');
  if (!req || !pin) return;

  try {
    const migrated = await migrateDevKeyToWrapped(pin);
    if (!migrated) {
      const key = await getOrCreateDeviceKey();
      await wrapDeviceKeyWithPIN(key, pin);
    }
  } catch (err) {
    console.error('[Lumen Guardian] Failed to wrap device key with PIN', err);
  } finally {
    localStorage.removeItem('guardian_pin_setup_request');
    localStorage.removeItem('guardian_pin_setup_pin');
    window.dispatchEvent(new Event('guardian:pin-updated'));
  }
}

export function handleRecoveryBridge() {
  const hashReq = localStorage.getItem('guardian_recovery_hash_request');
  const saltReq = localStorage.getItem('guardian_recovery_salt_request');
  if (!hashReq || !saltReq) return;
  try {
    localStorage.setItem('guardian_recovery_hash', hashReq);
    localStorage.setItem('guardian_recovery_salt', saltReq);
  } finally {
    localStorage.removeItem('guardian_recovery_hash_request');
    localStorage.removeItem('guardian_recovery_salt_request');
  }
}

export const __test__ = {
  handlePinSetupRequest,
  handleRecoveryBridge,
};
