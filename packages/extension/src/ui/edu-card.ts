export function showEducationCard(opts: { label: string; tips: string[] }) {
  const existing = document.getElementById('guardian-edu-card');
  if (existing) return;

  const container = document.createElement('div');
  container.id = 'guardian-edu-card';
  container.style.cssText = [
    'position:fixed',
    'bottom:16px',
    'right:16px',
    'z-index:2147483647',
    'background:#111827',
    'color:#fff',
    'padding:12px 14px',
    'border-radius:10px',
    'max-width:320px',
    'box-shadow:0 8px 24px rgba(0,0,0,0.25)',
    'font:14px/1.45 system-ui',
  ].join(';');

  const safeLabel = opts.label.replace(/</g, '&lt;');
  const tipsList = opts.tips.map((tip) => `<li>${tip}</li>`).join('');

  container.innerHTML = `
    <div style="font-weight:700;margin-bottom:6px">Heads up</div>
    <div style="opacity:0.85;margin-bottom:8px">We spotted signs of <b>${safeLabel}</b>. Try these tips:</div>
    <ul style="margin:0 0 8px 18px;padding:0">${tipsList}</ul>
    <div>
      <button id="guardian-edu-ok" style="margin-right:8px;padding:4px 10px">OK</button>
      <button id="guardian-edu-appeal" style="padding:4px 10px">This was a mistake</button>
    </div>
  `;

  document.body.appendChild(container);

  const dismiss = () => {
    container.remove();
  };

  const okButton = document.getElementById('guardian-edu-ok');
  if (okButton) okButton.addEventListener('click', dismiss);

  const appealButton = document.getElementById('guardian-edu-appeal');
  if (appealButton) {
    appealButton.addEventListener('click', () => {
      window.dispatchEvent(
        new CustomEvent('guardian:appeal', {
          detail: { label: opts.label },
        })
      );
      dismiss();
    });
  }
}
