export function blockNow({ reason }: { reason: string }) {
  const id = 'guardian-block-overlay';
  if (document.getElementById(id)) return;

  const el = document.createElement('div');
  el.id = id;
  el.style.position = 'fixed';
  el.style.inset = '0';
  el.style.zIndex = '2147483647';
  el.style.background = 'rgba(0, 0, 0, 0.55)';
  el.style.backdropFilter = 'blur(2px)';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.font = '600 16px/1.4 system-ui';
  el.style.color = 'white';
  el.textContent = `Blocked: ${reason}`;

  document.body.appendChild(el);
}
