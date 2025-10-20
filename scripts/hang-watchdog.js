// Prints active handles/requests after WATCHDOG_MS, can force-exit for CI.
const ms = Number(process.env.WATCHDOG_MS || 10000);
setTimeout(() => {
  const handles = process._getActiveHandles?.() ?? [];
  const reqs = process._getActiveRequests?.() ?? [];
  const name = (h) => (h?.constructor?.name || typeof h || 'unknown');
  console.error('\n[watchdog] Alive after', ms, 'ms');
  console.error('[watchdog] Handles:', handles.map(name));
  console.error('[watchdog] Requests:', reqs.map(name));
  if (process.env.WATCHDOG_FORCE_EXIT === '1') setImmediate(() => process.exit(0));
}, ms).unref();
