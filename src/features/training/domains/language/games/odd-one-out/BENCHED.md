# BENCHED — not wired into the app

**Odd One Out** is a complete, working game that is currently NOT registered in any
`domain.config.js`, so no code path reaches it. It was unwired from the language (its data.js feeds the pending Word Links merge)
domain when the game lineup changed; it is kept for possible re-use.

To revive it: add a sub entry with `gameKey` + `loader: () => import(...)` in the
domain config — `lazyGames.js` picks it up automatically. To retire it for good:
delete this folder.
