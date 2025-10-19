const ONBOARD_KEY = 'guardian_onboarded';

export function ensureOnboardingBanner() {
  if (typeof document === 'undefined') return;
  try {
    if (localStorage.getItem(ONBOARD_KEY) === '1') return;
  } catch {
    // ignore storage errors
  }
  if (document.getElementById('guardian-onboarding-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'guardian-onboarding-banner';
  banner.style.cssText = [
    'position:fixed',
    'top:16px',
    'right:16px',
    'z-index:2147483647',
    'background:#111827',
    'color:#fff',
    'padding:14px 18px',
    'border-radius:12px',
    'max-width:360px',
    'box-shadow:0 12px 30px rgba(0,0,0,0.35)',
    'font:14px/1.5 system-ui'
  ].join(';');

  const progress = {
    pin: false,
    dashboard: false,
    shadow: false,
  };

  function completeIfReady() {
    if (progress.pin && progress.dashboard) {
      try {
        localStorage.setItem(ONBOARD_KEY, '1');
      } catch {
        // ignore storage issues
      }
      banner.remove();
    }
  }

  function mark(step: keyof typeof progress) {
    progress[step] = true;
    const indicator = banner.querySelector(`[data-step=${step}] .guardian-onboarding-status`) as HTMLElement | null;
    if (indicator) {
      indicator.textContent = 'Done';
      indicator.style.color = '#34d399';
    }
    completeIfReady();
  }

  banner.innerHTML = `
    <strong style="display:block;margin-bottom:8px;font-size:16px">Welcome to Guardian</strong>
    <ol style="margin:0 0 8px 18px;padding:0">
      <li data-step="pin">
        Set your Parent PIN and write down the recovery code.
        <div class="guardian-onboarding-status" style="font-size:12px;color:#facc15;margin-top:4px">Pending</div>
      </li>
      <li data-step="shadow">
        Optional (dev): toggle shadow mode to capture shadow analytics.
        <div class="guardian-onboarding-status" style="font-size:12px;color:#facc15;margin-top:4px">Pending</div>
      </li>
      <li data-step="dashboard">
        Explore the Guardian dashboard to review alerts and QA tools.
        <div class="guardian-onboarding-status" style="font-size:12px;color:#facc15;margin-top:4px">Pending</div>
      </li>
    </ol>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
      <button id="guardian-onboarding-pin-start" style="padding:6px 10px">Open PIN Setup</button>
      <button id="guardian-onboarding-pin-done" style="padding:6px 10px">Step 1 Complete</button>
      <button id="guardian-onboarding-shadow" style="padding:6px 10px">Enable Shadow Mode</button>
      <a id="guardian-onboarding-dashboard" href="/dashboard" target="_blank" rel="noreferrer" style="padding:6px 10px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">Open Dashboard</a>
      <button id="guardian-onboarding-dismiss" style="padding:6px 10px">Dismiss</button>
    </div>
  `;

  document.body.appendChild(banner);

  const pinStart = banner.querySelector('#guardian-onboarding-pin-start') as HTMLButtonElement | null;
  if (pinStart) {
    pinStart.addEventListener('click', () => {
      try {
        window.open('/dashboard', '_blank', 'noopener');
      } catch {
        // ignore
      }
    });
  }

  const pinDone = banner.querySelector('#guardian-onboarding-pin-done') as HTMLButtonElement | null;
  if (pinDone) {
    pinDone.addEventListener('click', () => {
      mark('pin');
    });
  }

  const dismiss = banner.querySelector('#guardian-onboarding-dismiss') as HTMLButtonElement | null;
  if (dismiss) {
    dismiss.addEventListener('click', () => {
      try {
        localStorage.setItem(ONBOARD_KEY, '1');
      } catch {
        // ignore
      }
      banner.remove();
    });
  }

  const shadowButton = banner.querySelector('#guardian-onboarding-shadow') as HTMLButtonElement | null;
  if (shadowButton) {
    shadowButton.addEventListener('click', () => {
      try {
        localStorage.setItem('guardian_shadow', '1');
        shadowButton.textContent = 'Shadow Mode Enabled';
        shadowButton.disabled = true;
        mark('shadow');
      } catch {}
    });
  }

  const dashboardLink = banner.querySelector('#guardian-onboarding-dashboard') as HTMLAnchorElement | null;
  if (dashboardLink) {
    dashboardLink.addEventListener('click', () => {
      mark('dashboard');
    });
  }
}
