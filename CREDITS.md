# Third-party assets

`LICENSE` reserves all rights in this repository. That statement is about the
work created for this project — it does **not** apply to the third-party
material listed here, which arrives under its own terms. This file records what
those terms are.

Why it exists: the repository is **public**, and the app ships to the web and to
Google Play. Anything committed to `public/` is downloadable by anyone. For each
third-party asset we therefore need to be able to answer two questions — *where
did it come from* and *does its licence permit commercial use and
redistribution* — and to answer them from a record, not from memory.

---

## Audio

### Interface sounds — none. They are synthesized.

Every UI cue (`click`, `collect`, `correct`, `win`, `error`, `wrong`) is
generated at runtime by the Web Audio oscillators in `src/lib/sfx.js`. **No
audio file is involved, so no third-party licence applies.**

Kenney's CC0 *Interface Sounds* pack was briefly wired in and then removed —
not for licensing reasons (CC0 was verified and would have been fine) but
because it is a game-UI pack, voiced deliberately bright, and it sounded shrill
in this app. The reasoning is recorded at the top of `sfx.js`.

### Ambience — `public/Assets/sounds/rain.mp3`

**⚠ PROVENANCE UNVERIFIED — needs confirming before the next public release.**

Used by the Sleep Sounds practice (`src/features/relax/SleepSoundsPractice.jsx`).
It carries no ID3 tags and no licence file travelled with it, so its origin
cannot be established from the repository alone. A file named
`mixkit-rain-long-loop-2394.wav` sits in the local Downloads folder, which
*suggests* Mixkit — but that is an inference, not a record, and it has not been
confirmed.

This matters because "free to use" is not one thing. A CC0 dedication (as
above) allows redistribution of the file itself; several other common
free-stock licences permit use *within* a product while prohibiting
redistribution of the asset as a standalone downloadable file — which is
precisely what committing it to a public repository does.

**Action:** confirm the actual source and read its licence text, then either
record it here or replace the file. Until then, treat it as unresolved.

### Removed

`heavenly-loop.ogg`, the former background soundtrack, was deleted on
2026-09-02 as a product decision (the app has no music). No licence question
attaches to it.

---

## Fonts

Loaded from Google Fonts at runtime; see the `<link>` tags and the CSP in
`index.html`. The families in use are published under the **SIL Open Font
License 1.1**, which permits commercial use and embedding. They are linked
rather than vendored, so no font binary is committed here.

## Libraries

Third-party JavaScript is declared in `package.json` and resolved by npm; each
package carries its own licence in `node_modules`. Two are loaded from a CDN at
runtime rather than bundled:

- **Babylon.js** (3D maze) — Apache-2.0. Pinned with an SRI hash in
  `src/context/AppContext.jsx`.
- **three.js** (Void Runner) — MIT. Pinned to r128.

## Artwork

Original to this project — created by the copyright holder or generated for it
— and therefore covered by `LICENSE` rather than by this file. If any
third-party or stock artwork is ever added, it belongs in this document, with
its licence, **in the same commit**.
