# Lumen Guardian Privacy Promise

## Local-first by design
Lumen Guardian analyses conversations entirely in the browser. The extension does not call a cloud API, send transcripts, or stream telemetry off the device. Threat evaluations, blocking decisions, and QA metrics all live in the user’s profile storage.

## What stays on the device
- **Wrapped device key** – a 256-bit AES-GCM key encrypted with a parent-derived key (PBKDF2, 210k iterations).
- **Sealed evidence packets** – redacted snapshots of risky conversations; sealed with the device key and stored for parent review.
- **Local analytics counters** – detections, blocks, appeals, time-to-block samples, and optional shadow-mode comparisons.
- **Shadow diagnostics (opt-in)** – when `guardian_shadow=1`, classifier calibration stats are recorded for dashboard tuning only.

## Parent PINs & recovery codes
- PINs are never stored in plaintext. The dashboard derives an AES key via PBKDF2 and only the salted hash of the recovery code is retained.
- Recovery codes are generated locally; copy them to an offline location. Anyone with the recovery code can reset the PIN.
- Clearing browser storage or running a “Nuke Reset” invalidates the recovery code and removes all sealed evidence.

## No hidden telemetry
- Lumen Guardian does not collect browsing history, advertising identifiers, or third-party analytics.
- Shadow mode is strictly developer diagnostics. Disabling it (clear `guardian_shadow`) stops additional counters immediately.
- The QA dashboard surfaces every metric we track so parents can audit what the extension knows.

## Benchmarks & artifacts
- Performance runs use synthetic payloads and stay off disk by default. CI uploads (`bench-buffer.json`) include a SHA-256 checksum so reviewers can verify integrity without exposing real user data.
- Local copies of these artifacts are excluded via `.gitignore`; only the hashed CI uploads persist temporarily.

## Removing your data
- Disable the extension, run the in-app “Nuke Reset”, or clear the browser’s site data to erase all Guardian state.
- Uninstalling the extension deletes the service worker and its storage.
- Because everything is local, there are no support-side backups—if you erase the data, it is gone.
