# Kawkab Hops (Brixton) — benched 2026-08-09

Complete and working. Unregistered from `flexibility/domain.config.js`, so it is
unreachable in the app. Its Group War entry was repointed to Task Switch.
Recoverable by re-adding a sub with `gameKey: 'brixton'` and its loader.

## Why it was retired

It is a faithful Brixton Spatial Anticipation Test (Burgess & Shallice, 1997),
but it shared a loop with Card Sort — infer a hidden rule, then notice it
silently changed — and a three-game domain was running that loop twice. Of the
two, this one went because its paradigm is the more obscure and its surface the
less legible ("continue the hop pattern" needs explaining; sorting cards does
not).

## The defect found while deciding

At the top difficulty, where all five rules are live, `mirror` and `flip row`
are the SAME function on nodes 2 and 7 — mirror(2) = 7 and flip(2) = 7, and back
again. Measured over every start node and rule set:

```
easy [+1,-1]              0% ambiguous
mid  [+1,-1,+2]           0%
hard [+1,-1,+2,mirror]    0%
max  [all 5 rules]        8%  — and more demo hops never fix it
```

So 8% of hardest-tier rounds cannot be solved by reasoning at any length of
demo. Cheap to fix if it returns: exclude start nodes 2 and 7 when both rules
are live, or drop one of the two from the max set.
