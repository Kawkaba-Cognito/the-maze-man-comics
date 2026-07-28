/*
 * One-shot handoff for "open this chapter", used when the tap and the reader
 * live on different tabs.
 *
 * Home's sky and the Kawnera library used to be two pages of the same scroll,
 * so a tapped body could be passed straight down as a prop. Kawnera now lives
 * in the Learn tab, which only mounts once that tab is active — so the request
 * is parked here, and Learn claims it on mount. Deliberately module state and
 * not context: it is a message, not a value anything should re-render on.
 */
let pending = null;

/** @param {{bookId: string, chapterIndex: number}} target */
export function setPendingChapter(target) {
  pending = target ? { ...target, at: Date.now() } : null;
}

/** Reads and clears — a jump must never fire twice. */
export function takePendingChapter() {
  const target = pending;
  pending = null;
  return target;
}
