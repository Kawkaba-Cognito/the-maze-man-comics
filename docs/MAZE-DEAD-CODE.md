# The 3D maze: unreachable, kept on purpose

**Status as of 2026-07-26:** the Babylon 3D maze world — outer gate, labyrinth
campaign, boss fight, escape room, army recruits — **cannot be entered from
anywhere in the app.** The code is intact and still compiles into the bundle;
there is simply no UI path that starts it.

It was left in place deliberately (it may be revived), so this file records what
is dead, what still touches it, and what removing or restoring it would take —
so nobody has to re-derive it. CLAUDE.md still describes the maze as a live
feature; treat this file as the correction.

## Why it is unreachable

```
RoomHost                 rendered in AppShell.jsx:125, but only when `mazeVisible`
mazeVisible              set only by enterMaze()
enterMaze()              called only by AppShell.jsx:46, gated on `mazeEntryPending`
mazeEntryPending         set only by beginMazeEntry()
beginMazeEntry()         AppContext.jsx:377 — wrapped by four request* helpers
requestOuterGate         AppContext.jsx:402   ← called by NOTHING
requestContinueMaze      AppContext.jsx:408   ← called by NOTHING
requestMazeEntry         AppContext.jsx:414   ← called by NOTHING
requestEscapeRoom        AppContext.jsx:417   ← called by NOTHING
```

The chain is complete and correct — it just has no first domino. Verify with:

```bash
grep -rn "requestOuterGate\|requestContinueMaze\|requestMazeEntry\|requestEscapeRoom" src/ --include=*.jsx | grep -v AppContext
```

Empty output means it is still unreachable.

## What is orphaned

| area | files | lines |
|---|---|---|
| `src/components/maze/` (RoomHost, 9 rooms, 2 overlays, worldKit, characters3d, css) | 15 | 4,846 |
| `src/features/campaign/` (floors, progress, gate config, recruit spec) | 4 | 324 |
| `src/features/army/` (armyState) | 1 | 53 |

Babylon.js itself is **never downloaded** — it is fetched on demand inside
`beginMazeEntry`, so no user has loaded it since the last entry point was
removed.

## What still touches it (the part that is NOT a simple folder delete)

Three live files import from `campaign`/`army`. Because the maze can't be
entered, every one of these branches is permanently dead but harmless — they
read `false`/defaults from localStorage and render the "not started" path.

| file | line | what it does | on removal |
|---|---|---|---|
| `components/screens/ProfileScreen.jsx` | 14 | imports `getCampaignFloor`, `resetToGate`, `isGateBossBeaten`, `hasEnteredLabyrinth` | drop the import, the `gateDone` state (line 156) and the labyrinth block (lines ~398–410, including a "reset to gate" button) |
| `components/screens/PuzzlesScreen.jsx` | 10 | imports `hasEnteredLabyrinth` | drop the import and the `canContinue` gate (line 140) |
| `context/AppContext.jsx` | 4–5 | imports army + campaign state | drop both imports, the maze state (lines 69–70), `beginMazeEntry` and its four wrappers, `enterMaze`, `exitMaze`, and the army bookkeeping; then remove `mazeVisible`/`mazeEntryPending` from the context value and from `AppShell.jsx` (lines 29, 41, 60, 72, 125–127) |

## To remove it

1. `git rm -r src/components/maze src/features/campaign src/features/army`
2. Cut the three consumers per the table above.
3. `grep -rn "maze\|labyrinth\|campaign\|army" src/ --include=*.jsx --include=*.js -i`
   and clear the stragglers (strings in `langStrings.js` still define
   `enterMaze: 'ENTER MAZE'`).
4. Remove the maze entry from `ARCHITECTURE.md` and the "3D World" section of
   CLAUDE.md.
5. `npm run build && npm run lint` — there are no tests covering this, so the
   build and a manual pass over Profile and Puzzles are the safety net.

## To revive it

1. **Restore the CSP.** `https://cdn.babylonjs.com` was removed from
   `script-src` AND `connect-src` in `index.html` on 2026-07-26 because nothing
   loaded it. Without it the engine fetch is blocked and the maze silently
   fails to start.
2. Check the Babylon version pin and its **SRI hash** in `AppContext.jsx`
   (`beginMazeEntry`) — bumping the version without recomputing `integrity`
   breaks the whole world with no useful error.
3. Wire a real entry point: call `requestOuterGate()` (first run) or
   `requestContinueMaze()` (resume) from a screen. The rest of the chain above
   is intact and needs no changes.
4. `'unsafe-eval'` is still in `script-src`; Babylon's shader paths were its
   original justification, so it does not need restoring — but if it is ever
   removed while the maze is dead, reviving the maze will need it back.
