# Lumen Guardian Security Overview

## Cryptography at a glance
- **Evidence sealing:** 256-bit AES-GCM via Web Crypto. Each packet uses a fresh 96-bit IV generated with `crypto.getRandomValues`.
- **Device key wrapping:** The long-lived device key is exportable only for wrapping/unwrapping. It is persisted as JSON:
  ```json
  {
    "wrappedB64": "<AES-GCM ciphertext>",
    "ivB64": "<96-bit IV>",
    "saltB64": "<128-bit salt>",
    "iterations": 210000
  }
  ```
- **Parent PIN derivation:** PINs derive an AES key with PBKDF2 (SHA-256, 210k iterations, 128-bit salt). Recovery codes are hashed with the same parameters before storage.

## Locking, recovery, and resets
- Unlocking evidence requires the derived parent key; failed attempts feed an exponential backoff lockout.
- Generating a recovery code stores only a salted hash in localStorage. Entering the correct code unseals the device key and lets the parent set a new PIN.
- A “Nuke Reset” wipes the wrapped key, recovery hash, analytics, alerts, appeals, and evidence stores.

## Threat model
- **Mitigated:** passive network observers, malicious extensions trying to sniff requests (no cloud traffic), lost devices without the PIN/recovery code, and stale recovery codes after a nuke reset.
- **Requires vigilance:** keyloggers or OS-level malware, someone who already knows the PIN/recovery code, or hardware with compromised firmware.
- **Not stored anywhere:** the plaintext PIN, recovery code, transcripts, or tuning telemetry beyond the local profile.

## Shadow mode safety
- Shadow analytics compare fast-path detections with the ML classifier for calibration only.
- Shadow payloads are counters and probability distributions—no raw transcripts are written.
- Clearing `guardian_shadow` or “Nuke Reset” removes all shadow telemetry immediately.

## Build integrity
- **Package manager:** PNPM is the canonical tool. The `pnpm-lock.yaml` file is committed and installs use `--frozen-lockfile` in CI and on developer machines.
- **Action pinning:** GitHub Actions are pinned by SHA to reduce supply-chain drift.
- **Artifact verification:** Performance artifacts such as `bench-buffer.json` ship alongside a SHA-256 checksum and are referenced in PR comments for reproducibility.
