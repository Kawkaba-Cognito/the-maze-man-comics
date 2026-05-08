"""Remove near-uniform light/dark background from brain-side.png (no new art)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PNG = ROOT / "public" / "Assets" / "brain-side.png"


def main() -> None:
    im = Image.open(PNG).convert("RGBA")
    w, h = im.size
    px = im.load()

    # Sample corners — typical AI-export checker or flat gray/white
    samples = []
    for margin in (0, 1, 2, max(1, w // 60), max(1, h // 60)):
        for (cx, cy) in (
            (margin, margin),
            (w - 1 - margin, margin),
            (margin, h - 1 - margin),
            (w - 1 - margin, h - 1 - margin),
        ):
            if 0 <= cx < w and 0 <= cy < h:
                samples.append(px[cx, cy][:3])

    # Background "center" in RGB — use median-ish average of corner colors
    def med(lst: list[int]) -> int:
        s = sorted(lst)
        return s[len(s) // 2]

    br, bg, bb = (
        med([s[0] for s in samples]),
        med([s[1] for s in samples]),
        med([s[2] for s in samples]),
    )

    # Distance from background color; brain tissue is pink/salmon — far from gray
    def dist(r: int, g: int, b: int) -> float:
        dr, dg, db = r - br, g - bg, b - bb
        return (dr * dr + dg * dg + db * db) ** 0.5

    # Adaptive: threshold from corner spread + headroom
    corner_dists = [dist(*s) for s in samples]
    spread = max(corner_dists) if corner_dists else 0
    thresh = max(28.0, spread * 1.8 + 12)

    out = Image.new("RGBA", (w, h))
    opx = out.load()

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 10:
                opx[x, y] = (0, 0, 0, 0)
                continue
            d = dist(r, g, b)
            if d < thresh:
                # Soft edge: fade pixels near threshold
                t = max(0.0, min(1.0, (d - (thresh - 18)) / 18))
                alpha = int(255 * t * (a / 255.0))
                opx[x, y] = (r, g, b, alpha)
            else:
                opx[x, y] = (r, g, b, a)

    out.save(PNG, optimize=True)
    print(f"Saved {PNG} (bg~RGB({br},{bg},{bb}), thresh={thresh:.1f})")


if __name__ == "__main__":
    main()
