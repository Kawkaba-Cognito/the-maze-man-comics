# Security

Two halves, deliberately separated because they fail differently:

| | Where it lives | What enforces it |
|---|---|---|
| **Everything a machine can check** | `scripts/audit-security.mjs` | `npm run audit:sec` — blocks CI, blocks push |
| **Everything a machine cannot** | this file | your judgement, on a review date |

**This file must never grow a checkbox that a script could tick.** The previous
security checklist lived in prose and was wrong in three places within four
months — it claimed a CSP we did not have, a CDN we had stopped using, and two
vulnerabilities we had already fixed. Nobody wrote anything false; the code
moved and the prose did not. If you find yourself adding "make sure X is still
true" here, add a detector to `audit-security.mjs` instead.

---

## 1. The gate

```bash
npm run audit:sec           # full — includes npm audit (needs network, ~2 min)
npm run audit:sec:fast      # no network, sub-second — what the pre-push hook runs
npm run audit:sec -- --list # show every finding
npm run audit:sec -- --update   # accept current state as the new ceiling
```

**Install the hook once per clone** (git does not do this for you):

```bash
npm run hooks:install       # git config core.hooksPath .githooks
```

Without it, `.githooks/pre-push` is an inert file. Verify with
`git config core.hooksPath` → must print `.githooks`.

### What it checks, and why each rule exists

| Rule | Tolerance | Why |
|---|---|---|
| `secret-in-tracked-file` | **zero** | origin is a **public** repo. A pushed credential is public the instant it lands, and rewriting history does not remove it — GitHub still serves the old blob by SHA. |
| `gitignore-coverage` | **zero** | the ignore rules are the only thing between `git add -A` and a published key. Deleting a line is silent. |
| `csp-ratchet` | **zero** | the CSP may be tightened freely; **gaining** a source or an unsafe keyword fails. A removed directive fails too — dropping `object-src` re-opens it to `default-src`, dropping `base-uri` re-enables `<base>` hijacking. |
| `sri-integrity` | **zero** | every remote script must have `integrity` **and** `crossOrigin='anonymous'`. Without the second, browsers **silently ignore** the first — the pin looks present in review and does nothing at runtime. |
| `no-network-in-src` | **zero** | see §2. |
| `innerhtml-user-input` | ratcheted (2) | known XSS sinks; may not spread. See §4. |
| `innerhtml-interpolated` | ratcheted (5) | interpolated markup generally; debt, paid down over time. |
| `npm audit` | baseline (currently **0 across all severities**) | a new vulnerability fails; a known one at the ceiling does not block a bugfix. |
| `untracked-in-public` | advisory only | see §3. |

**The self-test is load-bearing.** Every detector runs against a known-bad
fixture on every invocation, and a detector that stops firing **fails the gate**
rather than silently passing the repo. This is not decoration — on the first run
here, the CSP parser matched `["']([^"']+)["']`, which terminates on the `'` in
`'self'`. It "successfully" parsed the policy as a single empty directive and
would have reported PASS forever. The lesson is the same one `audit:fq` and
`audit:mot` already taught this repo: **assert the outcome, not the parameters,
and prove your detector fires before you trust a clean run.**

### When the gate fails

1. `npm run audit:sec -- --list` — read the actual findings.
2. Fix it. That is the default and it is usually right.
3. Only if the rise is genuinely intended: `npm run audit:sec -- --update`, and
   **say why in the commit message**. The baseline is a debt ceiling, not a
   target. It ratchets *down* on its own — any run under baseline rewrites it
   lower, so a fix can never quietly regress.

---

## 2. The app's strongest property: it talks to nobody

`src/` makes **zero network calls** — verified, not assumed. No backend, no
telemetry, no analytics, no CDN calls except two SRI-pinned 3D engines loaded on
demand. There is no request to intercept, no token to steal, no CORS surface, no
server to breach.

Most of what a security checklist for a web app would tell you to do does not
apply here, and pretending otherwise produces a document nobody reads. Guard the
property instead: `no-network-in-src` is zero-tolerance.

**When Supabase lands, this rule gets an explicit allowlist — it does not get
deleted.** The point is that every outbound call is a deliberate, listed one.

---

## 3. Deploy path

CI (`deploy.yml`) is the safe path: clean runner, tracked files only, all gates.

**A manual `gh-pages` deploy bypasses every gate** and builds from your working
tree, which copies **all of `public/`** into `dist/` — including untracked
scratch. On 2026-08-06 that put 211 files / 2.6 MB of local preview art on the
live site and into the service-worker precache. There are **236 untracked files
in `public/` right now**; run `git status --short public/` before ever building
manually.

The pre-push hook closes the gate half of this hole. The `untracked-in-public`
count in every audit run is the reminder for the other half.

Deploy credentials, the two-account GCM situation, and the retention rules for
`gh-pages` are documented in `CLAUDE.md` — not duplicated here, because
duplicated operational prose is exactly what rotted last time.

---

## 4. Known accepted risks

Each has a **trigger**, not a date. Revisit when the trigger fires, not on a
calendar.

### 4.1 Stored XSS in Void Runner's high-score board
`src/features/puzzles/games/void-runner/index.jsx` — a pilot name typed into
`#vr-nameinput` (line ~1613) is stored in `localStorage.vrName` and rendered
into `tbl.innerHTML` **unescaped** (line ~1598).

- **Today:** self-XSS only. You would have to type the payload yourself, and the
  CSP has no `'unsafe-inline'` in `script-src`, so both injected `<script>` and
  `onerror=` handlers are blocked. Real, low.
- **Trigger:** the moment scores sync between users, or any name becomes
  shareable, this is textbook stored XSS. **Fix it before Supabase, not after.**
- **Fix:** escape on render, or build the rows with `textContent`/DOM nodes
  instead of a template string.

### 4.2 Personal data unencrypted in localStorage
Habit tracker, personality and relationship quizzes, Ikigai, cognitive
assessment scores, and the personalization model's 40-entry interaction history
are stored in plaintext via `src/lib/storage.js`, with no PIN or app-lock.
Anyone with device access — or a future XSS — can read it.

- **Accepted because** the alternative today is throwaway client-side crypto,
  where the key must also live on the device. That is theatre, not security.
- **Trigger:** Supabase Auth. Once a real trust boundary exists, revisit
  properly. Do not build local crypto in the meantime.
- **Note the interaction with 4.1** — an XSS in the same origin reads all of it.
  That is the strongest argument for fixing 4.1 early.

### 4.3 `'unsafe-eval'` in `script-src`
Justified by Babylon's shader compilation paths. Still unconfirmed whether
anything else needs it.

- **Trigger:** next time someone can exercise the 3D maze end-to-end. Remove it,
  play through the maze, watch the console. If clean, it comes out and the
  baseline tightens.

### 4.4 No sync or backup
Clearing browser data wipes a user's entire history, unrecoverably. This is a
**data-loss** risk rather than a security one, but it is the single hardest
constraint on launch: it must be solved before real users arrive. Tracked in
`CLAUDE.md` under the Supabase work.

---

## 5. Your laptop — what no CI job can check

The app has almost no attack surface. **Your development machine is the larger
target**, and none of this is checkable by a script. Review when a trigger below
fires, or once a quarter.

### Credentials
- [ ] **2FA on both GitHub accounts** (`Kawkaba-Cognito` and
      `thecognitivedolphin-commits`). Both can write to something that ships.
- [ ] Recovery codes stored somewhere that is **not** this laptop and not
      OneDrive.
- [ ] Windows Credential Manager holds both GitHub tokens in cleartext to any
      process running as you. Do not run untrusted binaries as your user.
- [ ] **The Android keystore is unrecoverable.** `*.jks` / `*.keystore` are
      gitignored — meaning they exist only on this disk. Losing it means you can
      never update the Play Store listing again, under any circumstance. Back it
      up offline, encrypted, today if you have not.

### Disk and sync
- [ ] **BitLocker on.** Check: `manage-bde -status C:` in an admin shell. A
      laptop without full-disk encryption hands over every token, keystore and
      `.env` the moment it is lost.
- [ ] This repo lives inside **OneDrive**. Anything untracked but present —
      `.env`, keystores, `.claude/` — is being **synced to Microsoft's cloud**
      whether or not git ignores it. `.gitignore` is not a sync boundary.
      Consider moving secrets outside the OneDrive tree entirely.

### Supply chain — the realistic way this project gets compromised
An npm package's `postinstall` script runs arbitrary code as you, with your
tokens and your keystore in reach. `npm install --legacy-peer-deps` runs it on
every dependency.

- [ ] Prefer `npm ci` over `npm install` when you are not deliberately changing
      dependencies — it installs the lockfile exactly and nothing else.
- [ ] Before adding **any** new dependency: check weekly downloads, last publish
      date, and whether the name is a near-miss of a popular package
      (typosquatting). This project has 6 runtime dependencies. Keep it that way.
- [ ] Never `npm install` a package a chat assistant (including me) suggested
      without checking it exists and is the one you meant.
- [ ] The weekly sweep (`.github/workflows/security.yml`) catches disclosed
      vulnerabilities in what you already have. It cannot catch a malicious
      package that nobody has reported yet.

### Editor and agent tooling
- [ ] `.claude/` is gitignored — it is machine-local and **not backed up by
      git**. The `consistency` skill lives there and does not travel with a
      clone.
- [ ] Anything pasted into an AI tool leaves this machine. Do not paste `.env`
      contents, keystore passwords, or Supabase service-role keys.

---

## 6. Before Supabase (do not start these early)

Deferred **on purpose** — with zero network calls there is no backend attack
surface, so deferring costs nothing while the app is unlaunched. The one hard
constraint is that it must land **before real users do** (§4.4).

When it starts, scaffold a [Spec Kit](https://github.com/github/spec-kit) flow
first (`/specify` → `/plan` → `/tasks` → `/implement`) rather than driving it
conversationally — it is large, multi-session, and easy to let drift.

- [ ] URL + anon key in `.env` (already gitignored; never hardcode)
- [ ] **RLS on every table**, own-rows-only, before any data is written
- [ ] Service-role key **never** reaches the frontend or a Capacitor bundle
- [ ] Custom SMTP configured — built-in Supabase SMTP allows ~2–4 auth
      emails/hour and signups will silently stall
- [ ] Auth rate limiting
- [ ] Add the Supabase origin to `connect-src`, and to the
      `no-network-in-src` allowlist — both are deliberate, reviewed edits
- [ ] Service worker must not cache authenticated responses or tokens
- [ ] Fix §4.1 first — synced scores make it a real stored XSS
- [ ] Sanitize all user-submitted text before write **and** on render
- [ ] Separate dev and prod Supabase projects
- [ ] Capacitor: HTTPS-only, no cleartext traffic

---

## 7. Deeper review passes (invoke, not automatic)

The gate is a tripwire — it catches known-bad patterns cheaply on every push.
It does not reason about your code. Run these before a release:

```
/security-review     # systematic OWASP-style review of changed code
/semgrep             # static analysis, parallel workers, taint tracking
```

Last full pass: semgrep, 2026-04-16 — 0 findings across 41 files / 74 rules.
The codebase is several times larger now; a fresh pass is due before launch.
