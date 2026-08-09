# Card Sort (WCST) — benched 2026-08-09

Complete and working. Unregistered from `flexibility/domain.config.js`, so it is
unreachable in the app; nothing else imports it. Recoverable by re-adding a sub
with `gameKey: 'wisconsin'` and its loader.

## Why it was retired

Not for quality — it is a faithful Wisconsin Card Sorting Test (Berg, 1948),
including the perseverative-error tracking. It was retired because the
Flexibility domain ran the SAME LOOP twice: this and Kawkab Hops both asked the
player to infer a hidden rule from sparse feedback and then notice it had
silently changed. Two of three games in the domain were that loop, and the loop
is inherently punishing — the trial right after a silent switch is unguessable
by design, so a player reasoning perfectly is still told they are wrong. That
fits a clinical instrument and fights an app whose stated identity is
non-judgmental.

Replaced by **Task Switch** (explicit shifting: the rule is always stated, you
pay in milliseconds) and **Sort It Another Way** (generative sorting: you
produce the rules). Between them they cover both halves of the construct
instead of serving one half twice.

## If it comes back

The unfairness has a known fix that was never applied: the WCST itself scores
the unavoidable first post-switch error separately from perseverative ones, and
this implementation counts it against accuracy like any other miss. Not counting
it would remove most of the "the game cheated me" feeling without touching the
paradigm.
