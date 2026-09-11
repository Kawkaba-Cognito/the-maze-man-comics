# Cancellation Premium Pass — Review Index

One line per review/plan document produced during this effort, in order, so it's clear what has already been looked at and by whom (or what lens), before starting new work.

| # | File | Author | Lens / scope | Status |
|---|---|---|---|---|
| 1 | `cancellation-premium-plan.md` | Opus (Plan) | Full review + research + plan (juice, audio, HUD, level-select, results) | Built (Round 1) |
| 2 | `cancellation-premium-plan-round2.md` | Opus (Plan) | Senior-QA sweep of Round 1's build across 11 categories (feel, audio, visual, a11y, bilingual, perf, edge cases, coach) | Built (Round 2) |
| 3 | `cancellation-premium-plan-round3.md` | Opus (Plan) + Sonnet measurement | Live-board background: Lumosity/BrainHQ research, actual pixel contrast measurement | Built (Round 3) |
| 4 | *(inline, see cancellation-todo.md)* | codebase-reviewer | Correctness lens over all 3 rounds' diff — found 2 severe state-machine bugs (fabricated win on restart-during-hold, stuck pause), 1 feedback-free-assessment leak, 1 untracked-asset risk | Done, all 4 fixed |
| 5 | *(inline, see cancellation-todo.md)* | codebase-reviewer | Design/a11y lens — found the goal-chip dark-mode contrast regression, gave a direct opinion that the generated photo clashed with the game's art direction | Done, both acted on |
| 6 | `cancellation-premium-plan-round4.md` | Opus (Plan) | Wider competitor research (Peak/Elevate/CogniFit + 2 empirical visual-search studies) + coherence audit + prioritized TODO — identified the game's own unused `cancel-cosmic-atlas-2026` art as the highest-leverage fix | Done, TODO built |

**Working todo list:** `cancellation-todo.md` (same directory) — the living, checkable list this index feeds.

**Ground rule carried from every prior round:** a passing gate or a clean pixel-math derivation is not proof a human sees anything. Nothing on the todo list gets checked off as "done" without an actual screenshot, once browser tooling is available — until then, items are "built, unverified on screen."
