export const __DEV__ = true;

export const __SHADOW__ = (() => {
  if (!__DEV__) return false;
  try {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem('guardian_shadow') === '1';
  } catch {
    return false;
  }
})();
