"""
Key the Kawkab planet mascot off its white studio plate.

── Why this is not a threshold ────────────────────────────────────────────
The two older scripts in this folder (punch-kawkab-bg.py, install-kawkab-clean.py)
decide "plate or not plate" per pixel and write alpha 0 or 255. That works on
flat art and fails on this one, because the character is EMISSIVE: it carries a
soft blue bloom that fades into the plate over ~30px. A threshold has to put the
cut somewhere inside that bloom, which either clips the glow off square or keeps
a grey collar of half-plate around it. Both were visible on the hub.

So this solves for alpha instead. Every pixel of a matted image satisfies

    P = a·F + (1 − a)·B

for the plate B, the true foreground F and coverage a. B is known (it is the
corner colour), and the subject is far darker than the plate, so taking the
channel that fell furthest from the plate gives

    a = 1 − min_c( P_c / B_c )

and F is then recovered by unmultiplying. A 40%-bloom pixel comes out at alpha
0.4 with its real blue restored, rather than as grey-blue at full opacity.

── The one thing alpha-solving gets wrong, and the fix ────────────────────
The sphere is covered in bright white star points. Solved on their own they are
PLATE-COLOURED, so they would key to alpha 0 and punch pinholes right through
the character. Topology has to come from somewhere else: a flood fill from the
border decides which pixels are OUTSIDE the subject, and only those get the
solved alpha. Anything the fill cannot reach — every star enclosed by the body —
stays fully opaque no matter what its colour says.

Flood fill for the REGION, alpha-solve for the EDGE.

    python scripts/key-kawkab-planet.py <source.png>
"""
from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "Assets" / "characters" / "kawkab" / "kawkab-planet.webp"

# A pixel this close to the plate is plate, for the purpose of REACHING through
# it. Deliberately loose (0.5): the fill has to travel through the whole bloom
# to reach the character's edge, and anything it reaches keeps its solved alpha
# anyway — so a generous threshold costs nothing and a tight one would strand
# the outer bloom at full opacity.
REACH = 0.5

# Below this the pixel is plate and nothing else; used only for the final crop.
FLOOR = 0.012

TARGET_W = 480


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(f"usage: {Path(__file__).name} <source.png>")
    src = Path(sys.argv[1])
    if not src.is_file():
        raise SystemExit(f"missing source: {src}")

    im = Image.open(src).convert("RGB")
    w, h = im.size
    P = np.asarray(im).astype(np.float64)

    # The plate, measured rather than assumed: the median of a 24px frame round
    # the edge. These renders carry a faint vignette, so a hardcoded 255 would
    # leave the corners keyed slightly opaque.
    frame = np.concatenate([
        P[:24].reshape(-1, 3), P[-24:].reshape(-1, 3),
        P[:, :24].reshape(-1, 3), P[:, -24:].reshape(-1, 3),
    ])
    B = np.median(frame, axis=0)
    B = np.maximum(B, 1.0)

    # a = 1 − min_c(P_c / B_c): the channel that dropped furthest below the
    # plate carries the coverage. A pixel brighter than the plate clamps to 0.
    a = 1.0 - np.min(P / B, axis=2)
    a = np.clip(a, 0.0, 1.0)

    # ── Region: what the border can reach through near-plate pixels ──
    reachable = a < REACH
    outside = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()

    def push(y: int, x: int) -> None:
        if reachable[y, x] and not outside[y, x]:
            outside[y, x] = True
            q.append((y, x))

    for x in range(w):
        push(0, x)
        push(h - 1, x)
    for y in range(h):
        push(y, 0)
        push(y, w - 1)

    while q:
        y, x = q.popleft()
        if y > 0:
            push(y - 1, x)
        if y < h - 1:
            push(y + 1, x)
        if x > 0:
            push(y, x - 1)
        if x < w - 1:
            push(y, x + 1)

    alpha = np.where(outside, a, 1.0)

    # ── Unmultiply: recover F from the matted P ──
    # Where alpha is tiny the division explodes, so those pixels take the plate
    # colour; they are invisible at that alpha regardless.
    safe = np.maximum(alpha, 1e-3)[..., None]
    F = (P - (1.0 - alpha)[..., None] * B) / safe
    F = np.clip(F, 0, 255)
    F = np.where(alpha[..., None] < 0.02, B, F)

    rgba = np.dstack([F, alpha * 255.0]).astype(np.uint8)
    out = Image.fromarray(rgba, "RGBA")

    # Crop to what actually carries ink, with a little air so the bloom is not
    # clipped by the box.
    solid = alpha > FLOOR
    ys, xs = np.where(solid)
    pad = 6
    box = (
        max(0, int(xs.min()) - pad), max(0, int(ys.min()) - pad),
        min(w, int(xs.max()) + 1 + pad), min(h, int(ys.max()) + 1 + pad),
    )
    out = out.crop(box)

    cw, ch = out.size
    out = out.resize((TARGET_W, round(ch * TARGET_W / cw)), Image.Resampling.LANCZOS)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT, "WEBP", quality=90, method=6)

    print(f"plate      {tuple(round(v) for v in B)}")
    print(f"crop       {box}  ->  {cw}x{ch}")
    print(f"written    {OUT.relative_to(ROOT)}  {out.size[0]}x{out.size[1]}  "
          f"{OUT.stat().st_size // 1024} KB  aspect {out.size[0] / out.size[1]:.3f}")
    print(f"corner a   {out.getpixel((0, 0))[3]}")


if __name__ == "__main__":
    main()
