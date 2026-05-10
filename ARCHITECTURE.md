# ARCHITECTURE & PLAN

This is the north star for the Maze Man codebase. Every change should make the code closer to this, not further from it. Read this before opening a PR.

> **For Claude/AI agents:** treat this as load-bearing. Do not introduce patterns that contradict it. If a request would violate a rule here, flag it instead of silently bending the rule.

---

## 1. Vision

A bilingual psychology comics + brain-game PWA that scales to dozens of games across 6 cognitive domains, ships premium content via a paywall, and stays maintainable for a solo vibe coder.

The codebase must be:
- **Obvious** — adding a new game = drop a folder, no tribal knowledge required.
- **Clean** — no 2,000-line files, no scattered colors, no dead code.
- **Secure** — no secrets in git, no XSS holes, no over-trusted input.
- **Fast** — first paint < 2s on mobile, smooth animations, lazy-loaded heavy stuff.

---

## 2. Target folder layout

```
src/
├── app/                          composition root
│   ├── App.jsx
│   ├── AppShell.jsx              router only
│   └── providers/                one provider per concern (added when needed)
├── features/
│   ├── splash/
│   ├── home/
│   ├── settings/
│   ├── profile/
│   ├── shop/
│   ├── comics/
│   ├── videos/
│   ├── maze3d/                   Babylon overlay
│   └── training/
│       ├── TrainingHub.jsx
│       ├── shared/               common UI (avatar, icons)
│       ├── domains/
│       │   ├── attention/
│       │   │   ├── domain.config.js
│       │   │   └── games/
│       │   │       └── cancellation/
│       │   │           ├── index.jsx     entry
│       │   │           ├── engine.js     pure logic, no React
│       │   │           ├── ui.jsx        rendering
│       │   │           ├── data.js       levels/configs
│       │   │           └── styles.css
│       │   ├── speed/   memory/   language/   reasoning/   flexibility/
│       │   └── ...
│       └── registry.js           hub auto-discovers domains/games
├── lib/                          framework-free utilities
│   ├── audio.js   speech.js   storage.js   analytics.js   iap.js
├── styles/
│   ├── tokens.css                single source of color/spacing/font
│   ├── reset.css
│   └── globals.css               truly global only
└── i18n/
    ├── en.js   ar.js
```

Rules of thumb:
- A **feature owns its CSS, its data, its state.** No feature reaches into another's files.
- A **game** is a folder with `index / engine / ui / data / styles`. Engine is pure JS, no React. UI is React, no game logic.
- **`lib/` is framework-free** — never imports React. Anyone can use it.
- **`features/training/registry.js`** is the only place that knows what games exist.

---

## 3. Migration plan

Two phases. Do Phase 1 fully before adding new features. Do Phase 2 only when triggered.

### Phase 1 — Foundation (do now, ~1–2 days)

| # | Step | Trigger | Effort |
|---|---|---|---|
| 1 | **Color tokens** — `styles/tokens.css` + `tokens.js`. Move home/hub palette here, replace literals. | Now | ~30 min |
| 2 | **Split `global.css`** per feature (splash/home/training/settings/game/globals). | After step 1 | ~2 h |
| 3 | **Per-domain folders** under `features/training/domains/`. Add `domain.config.js`. Add `registry.js`. | After step 2 | ~3 h |
| 4 | **Split the two 1,900-line games** (engine / ui / data / styles inside their folder). | After step 3 | ~2 h |
| 5 | **Lift Settings out of `SplashScreen.jsx`** into `features/settings/`. | After step 4 | ~1 h |

After Phase 1: every future feature drops into a clean slot.

### Phase 2 — Earn it (only when triggered)

| # | Step | Trigger |
|---|---|---|
| 6 | Carve out `lib/` (audio/speech/storage). | When a 2nd feature needs them outside AppContext. |
| 7 | Split `AppContext` into focused providers. | When AppContext crosses ~300 lines. |
| 8 | i18n catalog (`i18n/en.js`, `i18n/ar.js`). | When ternaries hurt or a 3rd language lands. |
| 9 | Entitlements + paywall gate. | ~2 weeks before launch. |
| 10 | Comics episode content model. | When episode 2 needs to be built. |

**Don't do Phase 2 work speculatively.** Wait for the trigger.

---

## 4. Code quality rules

Non-negotiable:

1. **No file over 500 lines.** If a component grows past that, split it (engine vs ui vs data).
2. **No hex colors in component files.** Use tokens. If a token is missing, add it.
3. **No copy-paste of strings between EN and AR ternaries** more than ~3 times. Move to `i18n/`.
4. **One feature = one folder.** Don't reach across features.
5. **Engine code is React-free.** Game logic is testable plain JS.
6. **No comments explaining *what* the code does.** Only *why*, when non-obvious.
7. **Delete unused code.** No `// removed` comments, no commented-out blocks. Git remembers.
8. **No `any`-style escape hatches** — no `dangerouslySetInnerHTML`, no `eval`, no `new Function`.
9. **Prop drilling > 3 levels = use context or move state up.**
10. **Names match the file.** `RushHourGame.jsx` exports `RushHourGame`. No surprises.

When in doubt: **smaller, more obvious, deletable.**

---

## 5. Security rules

PWA + (future) Supabase. The hard rules:

1. **No secrets in source.** All keys in `.env`. `.env` is gitignored. CI checks for leaked patterns before deploy.
2. **No `dangerouslySetInnerHTML`** anywhere.
3. **CDN scripts have SRI hashes** (Babylon.js etc.). Already in place — keep them.
4. **CSP headers** stay strict — only Babylon CDN + Google Fonts allowed.
5. **Sanitize all user input** before storage (username, profile fields). Use a minimal sanitizer (e.g. strip HTML/scripts).
6. **Supabase RLS on every table.** No table without row-level security policies.
7. **Service role key never reaches the frontend.** Anon key only.
8. **Auth tokens stay in Supabase's `localStorage`.** Never in URL params, never in `sessionStorage` for sensitive flows.
9. **`npm audit`** before every release. Fix critical/high.
10. **No telemetry of PII** without explicit consent.

See `CLAUDE.md` PWA Security Checklist for the deeper list.

---

## 6. Performance rules

Mobile-first. The user's phone is your test rig.

1. **First contentful paint < 2s** on a mid-range Android over 4G. Measure on every release.
2. **Lazy-load heavy stuff.** Babylon.js is already dynamic. Apply same pattern to any future big dependency.
3. **No images > 200 KB** without justification. Prefer WebP. Provide mobile + desktop variants for hero art.
4. **Avoid re-renders.** Memoize big lists. Don't pass new objects/functions through context if you can avoid it.
5. **Animations: CSS or `requestAnimationFrame`** — not `setInterval` for visuals.
6. **Web Audio nodes are short-lived** — create on demand, let GC clean up. Don't leak oscillators.
7. **One global SVG defs block per screen** when reusing gradients/filters — don't redefine inside a `.map()`.
8. **Bundle size budget: 400 KB gzipped** for the main JS bundle. Watch `dist/Assets/index-*.js` after build.
9. **No `console.log` in production.** Wrap in `import.meta.env.DEV`.
10. **Service worker caches deliberately.** Never cache auth tokens, never cache user-specific data.

---

## 7. Definition of "done" for any change

Before merging:

- [ ] No file over 500 lines (or pre-existing exception).
- [ ] No hex colors outside `tokens.css`/`tokens.js`.
- [ ] No new strings without bilingual coverage (EN + AR).
- [ ] `npm run build` succeeds with no warnings you introduced.
- [ ] Tested on real mobile (or DevTools mobile preview at minimum).
- [ ] No new `console.log` in production code paths.
- [ ] `npx gh-pages -d dist` after build (per `CLAUDE.md`).

---

## 8. When to update this doc

Update it when:
- A Phase 2 trigger fires and we're starting that step.
- We add a new top-level feature folder.
- A rule above turns out to be wrong in practice — change the rule, don't quietly violate it.

Last updated: 2026-05-10
