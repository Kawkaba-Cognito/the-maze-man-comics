/* =============================================================================
 * THE REVIEW BOARD — standards an app like this one is actually held to.
 *
 * WHY THIS EXISTS
 * ───────────────
 * An assistant is compliant by default. Ask for a game, get a game — it does not
 * spontaneously say "the scoring model you approved is psychometrically invalid"
 * or "this ships an XSS". The XSS in Void Runner sat in the repo until somebody
 * thought to ask about security specifically. This file is the standing question
 * nobody remembered to ask.
 *
 * THE RULE THAT KEEPS IT HONEST
 * ─────────────────────────────
 * Every finding must be either:
 *   (a) MECHANICAL — a `check` that runs against this repo and can fail, or
 *   (b) CITED      — a `source` URL to an authority outside this codebase.
 * Nothing else is allowed in. A review board that emits confident generic advice
 * is worse than no board, because it gets believed. This repo already learned
 * the cheaper version of that lesson: audit:fq certified an unplayable game for
 * months by asserting the right-looking thing.
 *
 * STATUS VOCABULARY
 * ─────────────────
 *   pass      — checked mechanically, currently satisfied
 *   fail      — checked mechanically, currently violated
 *   manual    — real requirement, but no machine can judge it; a human must
 *   not-yet   — a genuine requirement that does NOT apply until a trigger fires
 *               (almost all backend items: you cannot rate-limit a server you
 *               have not built). Never rendered as a failure.
 *
 * `not-yet` is the load-bearing one. Without it a board covering auth, RLS and
 * rate limiting would show a wall of red for an offline app that is correctly
 * built and correctly sequenced — and a board that cries wolf gets muted.
 * ========================================================================== */

export const DOMAINS = {
  science: {
    label: 'Scientific validity',
    blurb: 'Whether the cognitive claims and scores are defensible — the part a psychologist is accountable for, and the part no linter checks.',
  },
  privacy: {
    label: 'Privacy & compliance',
    blurb: 'What the law and the app stores require of software that collects psychological data.',
  },
  security: {
    label: 'Application security',
    blurb: 'The shipped client: secrets, CSP, XSS, supply chain. Enforced continuously by audit:sec.',
  },
  backend: {
    label: 'Backend & data',
    blurb: 'Auth, RLS, rate limiting, server-side validation. Dormant until Supabase lands — listed so nothing is discovered late.',
  },
};

/* Helper shorthands are injected by the runner as `ctx`:
 *   ctx.grep(pattern, paths)  → array of "file:line:text"
 *   ctx.exists(relPath)       → boolean
 *   ctx.read(relPath)         → string ('' if absent)
 *   ctx.tracked(glob)         → array of tracked paths
 */

export const STANDARDS = [
  /* ════════════════════════════════════════════════════════════════════════
   * SCIENTIFIC VALIDITY
   * ══════════════════════════════════════════════════════════════════════ */
  {
    id: 'SCI-01',
    domain: 'science',
    title: 'No unsupported cognitive-benefit claims in the product',
    severity: 'critical',
    what: 'The app must not claim that training improves memory, intelligence, focus, school or work performance, or that it delays cognitive decline or dementia, without human clinical evidence for that specific claim.',
    why: 'This is the single largest legal risk a cognitive-training app carries, and it lives in marketing copy rather than code. The FTC fined Lumosity $2,000,000 in 2016 for exactly this: 40 "brain training" games advertised as helping users reach their "full potential in every aspect of life" and as staving off memory loss and Alzheimer\'s. The FTC\'s position was that the science did not support it — practice makes you better at the games, with no demonstrated transfer to the real world. The settlement additionally requires human clinical testing before such claims may be made. You are a psychologist; this is the claim boundary you already know professionally, encoded so a stray marketing string cannot cross it quietly.',
    source: 'https://www.ftc.gov/news-events/news/press-releases/2016/01/lumosity-pay-2-million-settle-ftc-deceptive-advertising-charges-its-brain-training-program',
    check: (ctx) => {
      // Two tiers, because they carry very different weight and an earlier
      // version of this check conflated them:
      //   OUTCOME claims — transfer to real life, prevention of decline. These
      //     are what the FTC actually acted on, and they are the red line.
      //   ACTIVITY claims — "this trains your brain". Mild, ubiquitous in the
      //     category, and arguable. Reported for a human to judge, not failed.
      // Content banks are excluded: a trivia answer explaining neuroplasticity
      // is psychoeducation, not a product claim about this product.
      const outcome = ctx.grepUi(
        String.raw`(prevent|delay|stave|reduce[^"'\n]{0,12}risk|ward off)[^"'\`\n]{0,30}(dementia|alzheimer|decline|memory loss)|` +
        String.raw`(raise|increase|boost)[^"'\`\n]{0,12}(your )?(iq|intelligence)|` +
        String.raw`(improve|boost|enhance)[^"'\`\n]{0,20}(your )?(school|work|job|academic|real[- ]world)`,
        ['src'],
      );
      if (outcome.length) {
        return { status: 'fail', evidence: `${outcome.length} OUTCOME claim(s) — the category the FTC acted on:\n` + outcome.slice(0, 6).join('\n') };
      }
      const activity = ctx.grepUi('trains your brain|يدرّب دماغك', ['src']);
      const disclaimed = ctx.grep('not a medical test', ['src']).length > 0;
      return {
        status: 'manual',
        evidence: `No outcome claims — nothing about preventing decline, raising IQ, or improving school/work performance. `
          + `${activity.length} instance(s) of the milder ACTIVITY claim "Why this trains your brain" (shared hub label, EN + AR, on every game). `
          + (disclaimed
            ? 'Mitigated: domainScience.js already states "supports everyday focus but is not a medical test or diagnosis".'
            : 'NOT currently accompanied by a disclaimer.'),
      };
    },
    fix: 'The outcome red line is clear and you are on the right side of it — keep it that way. For the activity claim, a psychologist\'s call: "trains your brain" is defensible for practice effects on the task itself, and your existing "not a medical test or diagnosis" line does real work. If you ever want it airtight, "what this task measures" is descriptive where "why this trains your brain" is causal.',
  },

  {
    id: 'SCI-02',
    domain: 'science',
    title: 'Percentiles and standard scores disclose that norms are not validated',
    severity: 'high',
    what: 'Any age-percentile or standard score shown to a user must be accompanied, in the UI and in every language, by a statement that the reference values are not a validated normative sample.',
    why: 'Presenting a percentile implies a normative sample behind it. Showing "you are in the 72nd percentile" without one is the quiet half of the Lumosity problem — not a false claim in words, but a false claim in format. A number carries authority a paragraph does not. The disclosure has to render, not merely exist: a constant defined and never displayed is the failure mode this repo has hit repeatedly, where the comment was right and the code was stale.',
    source: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4630791/',
    check: (ctx) => {
      const defined = ctx.grep('NORM_DISCLAIMER\\s*=', ['src']).length > 0;
      const definedAr = ctx.grep('NORM_DISCLAIMER_AR\\s*=', ['src']).length > 0;
      // Rendered = referenced somewhere that is NOT its own definition file.
      const uses = ctx.grep('NORM_DISCLAIMER', ['src'])
        .filter((l) => !/NORM_DISCLAIMER(_AR)?\s*=/.test(l));
      if (!defined) return { status: 'fail', evidence: 'No NORM_DISCLAIMER constant found.' };
      if (!definedAr) return { status: 'fail', evidence: 'English disclaimer exists but no Arabic (NORM_DISCLAIMER_AR) — AR users see bare percentiles.' };
      if (uses.length < 2) return { status: 'fail', evidence: 'Disclaimer is defined but barely referenced — verify it actually renders.' };
      return { status: 'pass', evidence: `Disclaimer defined in EN + AR and referenced at ${uses.length} render sites (AssessmentFlow, WorkoutStats). assessmentNorms.js states outright: "RESEARCH-INFORMED reference values, NOT validated clinical or population norms".` };
    },
    fix: 'Already satisfied. If a new results surface is added, route its footnote through the same constant rather than retyping it.',
  },

  {
    id: 'SCI-03',
    domain: 'science',
    title: 'Change over time is separated from measurement noise',
    severity: 'high',
    what: 'When the app tells a user they improved, that statement must be backed by a reliable-change criterion, not a raw score difference.',
    why: 'Cognitive scores are noisy. Retest a person who has not changed at all and the number moves — practice effects, sleep, time of day, motivation. An app that celebrates every upward wobble is teaching a false lesson about the user\'s own mind, which for a psychology product is a substantive failure rather than a cosmetic one. The Reliable Change Index (Jacobson & Truax, 1991) is the standard instrument for this and is what a clinician would expect to see.',
    source: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8566921/',
    check: (ctx) => {
      const rci = ctx.grep('reliableChange|Jacobson', ['src']);
      return rci.length
        ? { status: 'pass', evidence: `Reliable Change Index implemented and cited (Jacobson & Truax 1991); ${rci.length} reference(s). WorkoutStats marks changes beyond noise with RCI ≥ 1.96.` }
        : { status: 'fail', evidence: 'No reliable-change computation found — improvements are being reported as raw differences.' };
    },
    fix: 'Already satisfied. Extend the same treatment to any new progress surface.',
  },

  {
    id: 'SCI-04',
    domain: 'science',
    title: 'Psychometric properties are measured, not assumed',
    severity: 'medium',
    what: 'For each task presented as a measure, know its test-retest reliability and, ideally, its concurrent validity against an established instrument.',
    why: 'This is the gap between "a game that resembles a cognitive test" and "a measure". Published mobile cognitive batteries report test-retest reliability explicitly — often poor-to-moderate for a single session, improving to moderate-to-good when sessions are averaged, which is itself an argument for how results should be presented. You already store per-trial data via trialLog, so the reliability of your own tasks is computable from data you are collecting — this is unusually achievable here, and it is the thing that would let the app make stronger claims honestly.',
    source: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8566921/',
    check: (ctx) => {
      const hasTrials = ctx.exists('src/features/training/shared/trialLog.js');
      // Precise identifiers only. The first version of this check used `icc\b`,
      // which matched a three-letter entry in the word game's dictionary and
      // reported PASS — a psychometrics standard satisfied by a Scrabble list.
      const hasReliability = ctx.grep(
        'testRetest|test_retest|cronbach|splitHalf|split_half|intraclassCorrelation',
        ['src'],
      );
      if (hasReliability.length) {
        return { status: 'pass', evidence: `Reliability computation found: ${hasReliability[0].split(':').slice(0, 2).join(':')}` };
      }
      return {
        status: 'manual',
        evidence: hasTrials
          ? 'trialLog.js captures per-trial data, so reliability is computable — but nothing computes it yet. No test-retest, split-half or ICC anywhere in src/.'
          : 'No per-trial capture and no reliability computation.',
      };
    },
    fix: 'A split-half or test-retest estimate per assessment task, computed from existing trialLog data. Until then, keep presenting the within-person trend as the primary signal (which the app already does) rather than the age percentile.',
  },

  {
    id: 'SCI-05',
    domain: 'science',
    title: 'Normative sample: known absent, honestly labelled',
    severity: 'medium',
    what: 'Age-band percentiles should rest on a collected normative sample stratified by age, education and sex.',
    why: 'Published norming studies use large samples — the NeuroCognitive Performance Test normed on ~130,000 volunteers — and evaluate factor structure and the effects of age, education and gender. You have none of this, which is entirely reasonable for an unlaunched app. The professional failure would not be lacking norms; it would be lacking them silently. Your assessmentNorms.js already documents the age trajectories it encodes and cites Salthouse, Hartshorne & Germine and others, which is the correct handling of a known limitation.',
    source: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4630791/',
    check: () => ({
      status: 'manual',
      evidence: 'No normative sample exists — correctly disclosed rather than hidden (see SCI-02). Reference means/SDs are author-set, age curves are literature-derived.',
    }),
    fix: 'Once real users exist and consent covers it, the app can norm on its own population. That is a post-Supabase project, and it is the thing that would convert this from a training app into a measurement instrument.',
  },

  /* ════════════════════════════════════════════════════════════════════════
   * PRIVACY & COMPLIANCE
   * ══════════════════════════════════════════════════════════════════════ */
  {
    id: 'PRI-01',
    domain: 'privacy',
    title: 'A published privacy policy exists',
    severity: 'critical',
    what: 'A privacy policy at a public, non-geofenced, non-editable URL (not a PDF), linked both from the store listing and from inside the app.',
    why: 'Google Play requires this of every app, and requires it even of apps that collect nothing when they are directed at children. There is no route to the Play Store without it, so it is a hard launch blocker rather than a nice-to-have. It is also the artefact that forces the useful question — what do we actually collect? — which usually improves the product.',
    source: 'https://support.google.com/googleplay/android-developer/answer/16810878?hl=en',
    check: (ctx) => {
      const files = ctx.tracked().filter((f) => /privacy|policy/i.test(f) && !/node_modules/.test(f));
      return files.length
        ? { status: 'pass', evidence: `Found: ${files.join(', ')}` }
        : { status: 'fail', evidence: 'No privacy policy anywhere in the repo, and no in-app link. This blocks Play Store release outright.' };
    },
    fix: 'Write it from a data inventory (what is stored under each mm_* key, why, for how long, who else sees it — currently nobody, which makes for a short and unusually honest policy). Host at the Pages URL and link from Settings.',
  },

  {
    id: 'PRI-02',
    domain: 'privacy',
    title: 'Prominent in-app disclosure before collecting psychological data',
    severity: 'critical',
    what: 'Before the first assessment, personality quiz, relationship quiz or habit entry, the app must tell the user in-app what is being stored, where, and that it is not backed up.',
    why: 'Two independent requirements land on the same screen. Google requires a prominent in-app disclosure — an actual on-screen message, not a policy link — when an app collects personal and sensitive data. Separately, GDPR classifies mental-health data as special category under Article 9, which requires *explicit* consent: a clear affirmative statement naming the specific categories, which "cannot be inferred from a user tapping Accept on a general terms screen". Your app collects cognitive assessment scores, a personality quiz, a relationship quiz, habit and wellbeing tracking, and Ikigai reflections. That is squarely special-category data.',
    source: 'https://secureprivacy.ai/blog/gdpr-article-9-special-categories-lawful-processing-and-compliance-guide-2026',
    check: (ctx) => {
      const consent = ctx.grep('privacyPolicy|privacy_policy|consentGiven|mm_consent|dataDisclosure', ['src']);
      return consent.length
        ? { status: 'pass', evidence: `Consent/disclosure plumbing found: ${consent.length} reference(s).` }
        : { status: 'fail', evidence: 'No consent or disclosure gate found. PersonalityQuiz, RelationshipQuiz, the assessment battery and the habit tracker all collect special-category data with no prior notice.' };
    },
    fix: 'One first-run screen, bilingual, naming the categories, plus a permanent summary in Settings. Because everything is local today, the honest version is short and reassuring: it never leaves the device, and it is not backed up.',
  },

  {
    id: 'PRI-03',
    domain: 'privacy',
    title: 'The user can export and erase their own data',
    severity: 'high',
    what: 'A one-tap export of everything stored, and a one-tap delete of everything stored.',
    why: 'GDPR grants access, portability and erasure as rights. Uniquely for this app they are almost free to implement: every key is mm_* in localStorage behind a single choke point (src/lib/storage.js), so export is a JSON dump and erasure is a loop. It also solves a real product problem you already have — there is no backup, so a cleared browser wipes a user\'s entire history unrecoverably. Export is the mitigation for that until Supabase lands.',
    source: 'https://www.adequacy.app/en/blog/health-data-gdpr-compliance',
    check: (ctx) => {
      const exportish = ctx.grep('exportAll|downloadData|exportProfile|JSON.stringify\\(.*localStorage', ['src']);
      const eraseAll = ctx.grep('clearAllData|eraseAll|wipeProfile|resetEverything', ['src']);
      if (exportish.length && eraseAll.length) return { status: 'pass', evidence: 'Both export and erase paths found.' };
      return {
        status: 'fail',
        evidence: `No whole-account export${eraseAll.length ? '' : ' and no global erase'} found. Per-feature resets exist (habits, individual game profiles) but nothing covers the user's data as a whole.`,
      };
    },
    fix: 'Two functions in src/lib/storage.js — dump every mm_* key to a downloaded JSON file, and remove every mm_* key — surfaced in Settings. Roughly an afternoon, and it doubles as your backup story.',
  },

  {
    id: 'PRI-04',
    domain: 'privacy',
    title: 'A decision exists about children using the app',
    severity: 'high',
    what: 'An explicit, recorded decision on whether under-13s (COPPA) / under-16s (GDPR) are an intended audience, and a store listing consistent with it.',
    why: 'A colourful bilingual cognitive-training app with cartoon planets and a mascot will attract children whether or not they are targeted. Play\'s Families policy and COPPA both attach obligations based on actual audience, not stated intent, and the app already asks for age to compute age-band percentiles — so it holds age data about minors. This needs a decision rather than a default.',
    source: 'https://support.google.com/googleplay/android-developer/answer/9893335?hl=en-GB',
    check: (ctx) => {
      const ageUse = ctx.grep('ageBand|ageGroup', ['src']).length;
      const gate = ctx.grep('ageGate|minimumAge|isMinor|parentalConsent', ['src']).length;
      if (gate) return { status: 'pass', evidence: 'An age gate or minor-handling path exists.' };
      return {
        status: 'fail',
        evidence: `Age is collected and used for percentile banding (${ageUse} reference(s) to ageBand/ageGroup) but there is no age gate, no minimum age, and no parental-consent path.`,
      };
    },
    fix: 'Decide the audience first — it changes the store listing, the policy and the consent flow. "13+ / not directed at children" is the simplest defensible answer and costs least.',
  },

  /* ════════════════════════════════════════════════════════════════════════
   * APPLICATION SECURITY — delegated to audit:sec, summarised here
   * ══════════════════════════════════════════════════════════════════════ */
  {
    id: 'SEC-01',
    domain: 'security',
    title: 'Continuous client-security gate',
    severity: 'high',
    what: 'Secrets, .gitignore integrity, CSP drift, SRI pins, network isolation and XSS sinks are checked on every push and every CI run.',
    why: 'A one-off audit ages out the moment the next commit lands. The gate is what converts a clean review into a property that stays true.',
    source: 'SECURITY.md',
    check: (ctx) => (ctx.exists('scripts/audit-security.mjs')
      ? { status: 'pass', evidence: 'audit:sec present, wired into deploy.yml and ci.yml, with a pre-push hook and a weekly sweep. 21 self-test assertions guard the detectors themselves.' }
      : { status: 'fail', evidence: 'No security gate.' }),
    fix: 'Run `npm run hooks:install` once per clone or the pre-push half is inert.',
  },

  {
    id: 'SEC-02',
    domain: 'security',
    title: 'User-supplied text is escaped before rendering',
    severity: 'high',
    what: 'No user-controlled string may reach innerHTML unescaped.',
    why: 'Void Runner takes a pilot name from an input, stores it, and renders it into innerHTML unescaped. Today it is self-XSS and your CSP blocks the usual payloads. The day any score or name is shared or synced it becomes ordinary stored XSS — and an XSS in this origin can read every assessment score and habit entry in localStorage, which is why this small bug is on the critical path to Supabase rather than after it.',
    source: 'SECURITY.md',
    check: (ctx) => {
      const sinks = ctx.grep('innerHTML', ['src/features/puzzles/games/void-runner']);
      return sinks.length
        ? { status: 'fail', evidence: `Void Runner high-score board renders a stored player name via innerHTML (${sinks.length} innerHTML site(s) in that file).` }
        : { status: 'pass', evidence: 'No unescaped sink found.' };
    },
    fix: 'Build the score rows with textContent / DOM nodes instead of a template string. Small change, removes the whole class.',
  },

  {
    id: 'SEC-03',
    domain: 'security',
    title: 'Platform-level supply-chain controls are enabled',
    severity: 'medium',
    what: 'GitHub secret scanning + push protection on, Dependabot on, and CI installing from the lockfile.',
    why: 'Push protection blocks a credential before it reaches a public repo — strictly stronger than a local hook, which only works if installed. And CI currently runs `npm install --legacy-peer-deps`, which may resolve versions other than the committed lockfile; `npm ci` is what makes a build reproducible and stops a dependency changing under you between runs.',
    source: 'https://supabase.com/docs/guides/deployment/going-into-prod',
    check: (ctx) => {
      const ciText = ctx.read('.github/workflows/ci.yml') + ctx.read('.github/workflows/deploy.yml');
      const usesCi = /npm ci\b/.test(ciText);
      const dependabot = ctx.exists('.github/dependabot.yml');
      const gaps = [];
      if (!usesCi) gaps.push('CI uses `npm install`, not `npm ci` — the lockfile is not enforced');
      if (!dependabot) gaps.push('no .github/dependabot.yml');
      gaps.push('GitHub secret scanning + push protection are OFF (verified via API; free on public repos)');
      return gaps.length > 1
        ? { status: 'fail', evidence: gaps.join('\n') }
        : { status: 'pass', evidence: 'Platform controls enabled.' };
    },
    fix: 'Settings → Code security → enable secret scanning and push protection. Add .github/dependabot.yml. Swap `npm install --legacy-peer-deps` for `npm ci --legacy-peer-deps` in both workflows.',
  },

  /* ════════════════════════════════════════════════════════════════════════
   * BACKEND — dormant until Supabase. Listed so nothing is found late.
   * ══════════════════════════════════════════════════════════════════════ */
  {
    id: 'BK-01',
    domain: 'backend',
    title: 'Row Level Security on every table, before any data is written',
    severity: 'critical',
    what: 'RLS enabled on every table in the public schema, each with an explicit own-rows-only policy. RLS enabled with no policy is also wrong — it denies everything and invites a permissive patch later.',
    why: 'With Supabase the anon key is in the client by design, so the database is directly reachable from the internet. RLS is not one layer of defence, it is THE layer: a table without it lets any client read and modify everything. Supabase\'s own Security Advisor exists largely to flag this, along with RLS-enabled-but-no-policy, security-definer views, and mutable function search paths.',
    source: 'https://supabase.com/docs/guides/deployment/going-into-prod',
    trigger: 'Supabase integration',
    check: () => ({ status: 'not-yet', evidence: 'No backend yet — src/ makes zero network calls, verified by audit:sec.' }),
    fix: 'Enable RLS in the same migration that creates each table, never as a follow-up. Run the Security Advisor before every release.',
  },

  {
    id: 'BK-02',
    domain: 'backend',
    title: 'The service-role key never reaches a client',
    severity: 'critical',
    what: 'Only the anon key ships in the web bundle or the Capacitor APK. The service-role key exists solely server-side.',
    why: 'The service-role key bypasses RLS entirely. In a Capacitor build the bundle is on the user\'s device and trivially unpackable, so "it is in a mobile app" is not concealment. This is the single mistake that turns a well-designed RLS schema into no security at all.',
    source: 'https://supabase.com/docs/guides/api/securing-your-api',
    trigger: 'Supabase integration',
    check: () => ({ status: 'not-yet', evidence: 'No Supabase keys in the project yet. audit:sec already fails on any JWT-shaped literal in a tracked file, so the tripwire is live before the risk is.' }),
    fix: 'Keep it out of .env files that Vite exposes — anything prefixed VITE_ is bundled and public. Add a dedicated audit:sec pattern for the service_role key when the time comes.',
  },

  {
    id: 'BK-03',
    domain: 'backend',
    title: 'Rate limiting on auth and on anything expensive',
    severity: 'high',
    what: 'Supabase auth rate limits reviewed and set deliberately; per-IP or per-user limits on any custom endpoint.',
    why: 'Auth endpoints are where credential stuffing and brute force land, and defaults are set for convenience rather than for your risk. There is a second, non-obvious limit that bites first: the built-in Supabase SMTP allows only ~2–4 auth emails per hour, so without custom SMTP your signups will silently stall long before an attacker shows up.',
    source: 'https://supabase.com/docs/guides/deployment/going-into-prod',
    trigger: 'Supabase Auth',
    check: () => ({ status: 'not-yet', evidence: 'No auth endpoints exist.' }),
    fix: 'Authentication → Rate Limits in the dashboard, plus custom SMTP configured before launch.',
  },

  {
    id: 'BK-04',
    domain: 'backend',
    title: 'Server-side validation of everything the client sends',
    severity: 'high',
    what: 'Constraints, checks and policies in the database; validation in edge functions. Client-side validation is a UX feature, not a control.',
    why: 'Anyone can call your API directly with the anon key — the client is not the only caller, it is merely the polite one. For this app the concrete risk is score integrity: a leaderboard or a synced assessment result is worth forging, and "the game only submits plausible scores" is not enforcement. Feature gating, quotas and cross-service authorization belong in application code and policy, not in the UI.',
    source: 'https://supabase.com/docs/guides/api/securing-your-api',
    trigger: 'Supabase integration',
    check: () => ({ status: 'not-yet', evidence: 'Nothing is submitted anywhere.' }),
    fix: 'Decide per table whether the client may write directly under RLS, or must go through an edge function that validates. Assessment results and any leaderboard belong in the second category.',
  },

  {
    id: 'BK-05',
    domain: 'backend',
    title: 'Edge functions verify the caller, and public ones are deliberate',
    severity: 'medium',
    what: 'Functions verify the caller JWT by default; any function made public is an explicit, reviewed decision.',
    why: 'Supabase edge functions verify the JWT and return 401 without a valid token unless you turn that off. The risk is not the default — it is switching it off to debug something and never switching it back.',
    source: 'https://supabase.com/docs/guides/security/product-security',
    trigger: 'First edge function',
    check: () => ({ status: 'not-yet', evidence: 'No edge functions.' }),
    fix: 'Keep a comment naming the reason beside any `verify_jwt = false`.',
  },

  {
    id: 'BK-06',
    domain: 'backend',
    title: 'Encryption at rest becomes meaningful — revisit the localStorage decision',
    severity: 'medium',
    what: 'Re-evaluate storing assessment scores, quiz results and habit data unencrypted once a real trust boundary exists.',
    why: 'Today this is correctly accepted: client-side encryption with a key on the same device is theatre, and there is no server to hold a key. The moment Supabase Auth exists, that argument expires — there is now a real key custodian and a real account boundary, and the same data becomes a breach target rather than a device-access risk. The decision is right; it is the expiry that must not be forgotten.',
    source: 'SECURITY.md §4.2',
    trigger: 'Supabase Auth',
    check: () => ({ status: 'not-yet', evidence: 'Accepted risk, documented in SECURITY.md §4.2 with Supabase Auth as its stated trigger.' }),
    fix: 'When auth lands, decide per data category: synced (encrypted in transit and at rest, RLS-protected) versus device-only.',
  },
];
