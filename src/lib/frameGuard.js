/*
 * FRAME GUARD — refuse to run inside somebody else's iframe.
 *
 * ── THE HOLE THIS CLOSES (audited 2026-08-29) ────────────────────────────
 * Nothing was stopping this app being embedded in a hostile page. Verified
 * against the live site rather than assumed:
 *
 *   curl -sI https://kawkaba-cognito.github.io/the-maze-man-comics/
 *     → no X-Frame-Options, no Content-Security-Policy header at all
 *
 * GitHub Pages cannot send response headers, so the app's entire CSP is the
 * `<meta http-equiv>` tag in index.html.
 *
 * ⚠ AND `frame-ancestors` IS SPECIFIED TO BE IGNORED IN A META TAG. It is
 * header-only, by design. So "just add frame-ancestors to the CSP" does NOT
 * work here — it would sit in index.html looking like protection while doing
 * nothing, which is worse than no protection because the next person reads it
 * and stops looking. That is why the defence is this file and not a meta tag.
 *
 * ── WHAT THE RISK ACTUALLY IS, AND WHAT IT IS NOT ────────────────────────
 * NOT data theft. A cross-origin frame cannot read this app's DOM or its
 * localStorage — the same-origin policy still holds, and there is no auth token
 * or session cookie to steal because there is no backend.
 *
 * It IS clickjacking (UI redressing): an attacker page overlays an invisible
 * frame of this app and steers the user into clicking real controls in their
 * OWN session. The damaging targets here are Settings → Delete Account, which
 * wipes local data, and the `rx_*` wellbeing stores (personality, relationship,
 * Ikigai, habit history) — the most sensitive things on the device. Losing
 * those to a click the user did not understand they were making is a real harm
 * even though nothing is exfiltrated.
 *
 * ── WHY IT LIVES IN A MODULE, NOT AN INLINE SCRIPT ───────────────────────
 * ⚠ The CSP's `script-src` is `'self' 'unsafe-eval' <cdns>` — there is NO
 * `'unsafe-inline'`. An inline <script> frame-buster in index.html would be
 * BLOCKED BY OUR OWN CSP and silently do nothing. It has to be same-origin
 * script, i.e. this module, imported from main.jsx before React mounts.
 *
 * The cost of that choice is honest: the guard runs after the entry chunk
 * loads, so a framed page is briefly blank rather than blocked from the very
 * first byte. Nothing sensitive is rendered before React mounts, so there is no
 * window in which a real control could be clicked.
 *
 * We do NOT navigate the parent (`top.location = self.location`). That is the
 * classic frame-buster and it is both blockable (`sandbox` without
 * `allow-top-navigation`) and itself an open-redirect-shaped behaviour. Refusing
 * to render is strictly safer: there is nothing to click either way.
 */

/** True when this document is not the top-level one. */
export function isFramed() {
  try {
    return window.top !== window.self;
  } catch {
    /* Cross-origin parent — reading window.top throws, which by itself proves
       we are inside a frame we do not own. */
    return true;
  }
}

/**
 * If framed, replace the document with a plain notice and return true, so the
 * caller can skip mounting the app.
 */
export function guardAgainstFraming() {
  if (!isFramed()) return false;

  const doc = document;
  doc.documentElement.style.background = '#05050f';
  doc.body.innerHTML = '';

  const wrap = doc.createElement('main');
  wrap.style.cssText = 'min-height:100vh;display:flex;flex-direction:column;align-items:center;'
    + 'justify-content:center;gap:14px;padding:24px;text-align:center;'
    + 'font-family:system-ui,sans-serif;color:#e8e1d2;background:#05050f';

  const h = doc.createElement('h1');
  h.textContent = 'This app cannot run inside another site';
  h.style.cssText = 'font-size:1.1rem;font-weight:800;margin:0';

  const p = doc.createElement('p');
  p.textContent = 'It was opened inside a frame on another page. Open it directly instead.';
  p.style.cssText = 'font-size:0.9rem;opacity:0.8;margin:0;max-width:38ch;line-height:1.5';

  /* Built from location, never from anything the parent controls — an attacker
     who can frame us must not be able to choose where this link points. */
  const a = doc.createElement('a');
  a.href = window.location.href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = 'Open the app';
  a.style.cssText = 'color:#00f5ff;font-weight:700;text-decoration:underline';

  wrap.append(h, p, a);
  doc.body.appendChild(wrap);
  return true;
}
