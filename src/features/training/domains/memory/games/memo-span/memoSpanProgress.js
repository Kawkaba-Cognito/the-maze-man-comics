const KEY = 'mm_memo_span_v1';

export function loadMemoSpanProfile() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch {
    return {};
  }
}

export function saveMemoSpanProfile(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data || {}));
  } catch {}
}
