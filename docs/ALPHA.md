# Lumen Guardian – Alpha Program

Thanks for testing the Lumen Guardian alpha! This build is feature-complete for the first public reviewer drop. Everything still runs locally—no accounts, no telemetry, and no remote services.

## How to install

1. Download `lumen-guardian-extension.zip` from the latest build.
2. Extract it and open `chrome://extensions`.
3. Enable **Developer mode** and click **Load unpacked**.
4. Select the `dist` folder inside `packages/extension`.
5. Pin the “Lumen Guardian (Alpha)” action for quick access.

## First-run checklist

- Open the Lumen Guardian banner and follow the three steps:
  1. Set your Parent PIN and save the recovery code offline.
  2. (Optional) Enable shadow mode for classifier calibration.
  3. Launch the dashboard to review alerts & QA tools.
- Trigger a sample detection (copy the corpus text from the dashboard simulator) and confirm:
  - The child sees the lock overlay.
  - A sealed alert appears in the dashboard.
  - Unlocking requires the parent PIN.
- Test the recovery flow: use the recovery code to rotate the PIN, then verify the old PIN no longer works.

## Calibration & tuning

1. Enable shadow mode (`localStorage.guardian_shadow = "1"`) to log classifier vs. fast-path agreement.
2. Visit the QA page (`packages/dashboard`) and open:
   - **Analytics** for shadow totals and probabilities.
   - **Tuner** to tweak thresholds and save them back to the model.
   - **Corpus Runner** to regress false positives/negatives.
3. After tuning, run `pnpm -w test` and rebuild the extension before sharing new artifacts.

## Known limitations

- Host permissions are scoped to major chat platforms (Discord, Messenger, Instagram, Snapchat, Facebook, WhatsApp Web, Telegram). Other domains require explicit approval.
- Classifier training currently relies on manual corpora and appeals; automated labelling is planned.
- Dashboard UX is tuned for desktop Chrome; mobile layouts are not yet optimised.

## Feedback

Please file issues or feature requests by emailing **alpha@lumenguardian.app** or opening a ticket in the internal tracker. Include:

- Browser & OS
- Steps to reproduce
- Whether shadow mode, tuner adjustments, or recovery flows were involved

Thank you for helping us ship a safe, transparent child-protection tool.
