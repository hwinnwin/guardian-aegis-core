interface AttemptState {
  count: number;
  last: number;
}

const KEY = 'guardian_parent_auth_attempts';

function read(): AttemptState {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return { count: 0, last: 0 };
    const parsed = JSON.parse(raw) as AttemptState;
    return {
      count: typeof parsed.count === 'number' ? parsed.count : 0,
      last: typeof parsed.last === 'number' ? parsed.last : 0,
    };
  } catch {
    return { count: 0, last: 0 };
  }
}

function write(state: AttemptState) {
  sessionStorage.setItem(KEY, JSON.stringify(state));
}

export function registerFailure(): AttemptState {
  const next: AttemptState = { count: read().count + 1, last: Date.now() };
  write(next);
  return next;
}

export function clearFailures() {
  write({ count: 0, last: 0 });
}

export function getFailureState(): AttemptState {
  return read();
}

export function computeLockoutMs(state: AttemptState): number {
  if (state.count < 5) return 0;
  const penalty = Math.min(60_000, (state.count - 4) * 5_000);
  const elapsed = Date.now() - state.last;
  const remaining = penalty - elapsed;
  return remaining > 0 ? remaining : 0;
}
