/*
 * TEMPORARY DIAGNOSTIC — added 2026-08-21 to catch the "the screen freezes and
 * then back and pause do nothing" report. Delete once the cause is found.
 *
 * The symptom is hard to attribute by reading source, because a blocked main
 * thread makes EVERY control look broken at once: the tap is dispatched, the
 * handler never runs, no sound plays, nothing repaints. Whichever button you
 * happened to press gets the blame. This watcher answers the two questions that
 * separate the real cause from the guesses:
 *
 *   1. Is the main thread actually blocked, and for how long?  → [LONGTASK]
 *   2. Did the tap that "did nothing" ever reach the DOM?      → [TAP]
 *
 * A [TAP] with no state change and NO following [LONGTASK] means the tap landed
 * on the wrong element (something transparent over the button). A [TAP] followed
 * by a long block means the handler ran and the thread then stalled. No [TAP] at
 * all means the pointer never reached the button.
 *
 * ⚠ Read document.hidden on every record. A BACKGROUND tab throttles rAF and
 * timers to nothing, which looks exactly like a freeze from the outside — that
 * false positive already cost this investigation an hour, so every line says
 * whether the page was visible when it happened.
 */

const MAX_RECORDS = 200;

/** Cheap description of an element: tag + the class that identifies the screen. */
function describe(el) {
  if (!el || !el.tagName) return 'none';
  const cls = String(el.getAttribute?.('class') || '').split(/\s+/).filter(Boolean).slice(0, 3).join('.');
  const label = el.getAttribute?.('aria-label');
  return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}${label ? `[${label}]` : ''}`;
}

/*
 * Which screen is on top right now. Every tab stays mounted (AppShell hides them
 * with display:none), so "what is rendered" is not the same as "what is visible"
 * — checkVisibility is the only honest answer here.
 */
function visibleScreen() {
  const candidates = document.querySelectorAll(
    '.c3d-root, [class*="ct-training-play"], [class*="ct-sm-play"], .pz-studio-game, [class*="ct-fq-"]',
  );
  for (const el of candidates) {
    if (el.checkVisibility?.() && el.getBoundingClientRect().width > 0) return describe(el);
  }
  return 'no game surface visible';
}

export function startLongTaskWatch({ thresholdMs = 200 } = {}) {
  if (typeof window === 'undefined') return () => {};

  const records = [];
  const push = (rec) => {
    records.push(rec);
    if (records.length > MAX_RECORDS) records.shift();
  };
  // Readable from the console (or an automation eval) without scraping logs.
  window.__freezeLog = records;

  /* Long tasks are >=50ms by spec. Anything at or over the threshold is what a
     player actually perceives as a freeze; the 50-200ms band is counted but not
     printed, so the console stays readable during normal play. */
  let smallTasks = 0;
  let observer = null;
  try {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration < thresholdMs) { smallTasks += 1; continue; }
        const attribution = entry.attribution?.[0];
        const rec = {
          kind: 'longtask',
          ms: Math.round(entry.duration),
          at: Math.round(entry.startTime),
          hidden: document.hidden,
          screen: visibleScreen(),
          // Usually 'window'/'unknown' for same-origin script, but free to read.
          container: attribution ? `${attribution.containerType || '?'}:${attribution.containerName || attribution.containerSrc || '?'}` : '?',
          minorSince: smallTasks,
        };
        smallTasks = 0;
        push(rec);
        console.warn(
          `[LONGTASK] ${rec.ms}ms blocked · screen=${rec.screen} · hidden=${rec.hidden} · minor-since=${rec.minorSince}`,
        );
      }
    });
    observer.observe({ entryTypes: ['longtask'] });
  } catch {
    // Safari and older engines have no longtask entry type; taps still record.
    console.warn('[LONGTASK] longtask observer unavailable — tap logging only');
  }

  /* Capture phase, so this sees the pointer BEFORE any handler (or any overlay
     that calls stopPropagation) can swallow it. elementFromPoint is what says
     whether the button the player aimed at is really the topmost thing there. */
  const onPointerDown = (event) => {
    const top = document.elementFromPoint(event.clientX, event.clientY);
    const button = event.target?.closest?.('button, [role="button"]');
    const rec = {
      kind: 'tap',
      at: Math.round(performance.now()),
      hidden: document.hidden,
      target: describe(event.target),
      topmost: describe(top),
      button: button ? describe(button) : 'NOT ON A BUTTON',
      // The tell for "the button is there but something invisible covers it".
      covered: !!(button && top && !button.contains(top) && button !== top),
    };
    push(rec);
    console.warn(
      `[TAP] ${rec.button} · topmost=${rec.topmost}${rec.covered ? ' · ⚠ COVERED' : ''} · hidden=${rec.hidden}`,
    );
  };
  window.addEventListener('pointerdown', onPointerDown, true);

  console.warn(`[LONGTASK] watching — blocks >=${thresholdMs}ms and every tap. window.__freezeLog holds the last ${MAX_RECORDS}.`);

  return () => {
    observer?.disconnect();
    window.removeEventListener('pointerdown', onPointerDown, true);
  };
}
