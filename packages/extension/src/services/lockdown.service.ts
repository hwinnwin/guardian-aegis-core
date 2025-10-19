export class LockdownService {
  private active = false;
  private timeoutId: number | null = null;

  start(durationMs = 60_000) {
    if (this.active) return;
    this.active = true;
    document.documentElement.setAttribute('data-guardian-lockdown', '1');
    this.timeoutId = window.setTimeout(() => this.stop(), durationMs);
  }

  stop() {
    if (!this.active) return;
    this.active = false;
    document.documentElement.removeAttribute('data-guardian-lockdown');
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
    }
    this.timeoutId = null;
  }

  isActive() {
    return this.active;
  }
}
