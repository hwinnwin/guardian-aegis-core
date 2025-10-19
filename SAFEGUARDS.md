# Lumen Guardian Safeguards

## Redaction & evidence hygiene
- Only the risky slice of conversation is preserved. Non-matching lines are blurred or removed before sealing.
- Evidence packets carry minimal metadata (sender, timestamp, labels) so parents can understand the alert without over-collecting.

## Cooldowns & advisory handling
- Fast-path and ML advisories share a 20-second per-sender cooldown to avoid spamming the child with alerts.
- “Medium” advisories notify the parent dashboard but do not block the child; escalation to a block only happens on HIGH or CRITICAL matches.

## Parent oversight & auditing
- Unlocking any sealed packet requires the parent PIN. Attempts are logged and throttled with exponential backoff.
- Appeals are stored locally; the trainer panel can incorporate them as negative samples to reduce false positives.
- The QA dashboard mirrors every counter (detections, blocks, appeals, shadow agreement) so families can audit behaviour.

## Reset & recovery safeguards
- Recovery codes rotate the PIN without exposing the device key.
- The “Nuke Reset” workflow deletes all sealed evidence, analytics, recovery hashes, and keys in one action.

## Developer-only tooling
- Shadow mode never alters detection outcomes. It simply records probability bins and agreement rates for calibration.
- Clearing `guardian_shadow` or wiping storage disables shadow logging instantly.
