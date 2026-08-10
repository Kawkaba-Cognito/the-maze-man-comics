# N-Back — benched from the training hub (2026-08-10)

Replaced in the memory domain by **Keep Track** (`../keep-track`). The files stay
here and the game still runs — do not delete it.

## Still live in one place

The clinical assessment battery runs N-Back as its memory paradigm
(`assessment/assessmentConfig.js`, `AssessmentFlow.jsx`, `paradigmAnchors.js`).
`AssessmentFlow` resolves the component through `getLazyGame`, so the loader is
kept registered explicitly in `lazyGames.js` even though no `domain.config.js`
sub points at it any more. **Removing that block renders the memory pillar as
nothing**, silently — there is no error, just an empty part of the battery.

The assessment moves to Keep Track only once Keep Track has an assess mode and
reference data of its own. When it does, stamp the paradigm into the stored
sessions so the Cognitive Index shows a break in the line rather than trending a
memory score across two different measures.

## Why it was benched

**1. The domain had a hole this game did not fill.** Story Time and Pair Match
are both visual, both immediate, both hand the items back to you, and neither
loads the central executive. The gaps were *verbal material* and *executive
load*. Dual N-Back covered the second and not the first, and it was the third
visual task in a three-visual-task domain.

**2. It punished trials that could not be known.** This is the same flaw that
benched Card Sort and Kawkab Hops: lose the thread and you cannot recover it
within the block, and the lure trials are unfair by design. Keep Track always
leaves you an answer to give.

**3. The science claim was the weakest on the platform.** The old science panel
and `assessmentRefs.js` both led with Jaeggi et al. (2008) — the "working-memory
training raises fluid intelligence" result, which is the most prominent failed
replication in the brain-training literature (Redick et al. 2013;
Melby-Lervåg & Hulme; Simons et al. 2016). N-Back remains a reasonable *measure*
of updating; what collapsed is the *transfer* claim. For an app about psychology
written by a psychologist, that citation was a liability.

⚠ `assessmentRefs.js` still carries the Jaeggi citation for the memory pillar,
because the pillar still runs N-Back. Update it in the same pass that migrates
the assessment — not before, or the reference will describe a task the battery
is not running.

**4. It was the platform's consistency outlier.** N-Back was the only registered
game built on **neither** `ModeShell` **nor** `STR_COMMON` — it hand-rolled its
own mode state machine and retyped all 43 shared labels in a local `UI` dict,
free to drift from the other eighteen games. That is why the memory domain felt
like a different app.

## If it comes back

It would need: ModeShell + STR_COMMON, single-stream rather than dual, and a
science panel that claims measurement instead of transfer.
