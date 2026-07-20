"""Install domain planet webps from Cursor assets folder into public/Assets/domain-planets."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(r"C:\Users\user\.cursor\projects\c-Users-user-OneDrive-Documents-maze-man-comics\assets")
OUT = ROOT / "public" / "Assets" / "domain-planets"
DOMAINS = ("attention", "speed", "memory", "language", "reasoning", "flexibility")


def is_plate(r: int, g: int, b: int) -> bool:
    if max(r, g, b) < 40:
        return True
    if min(r, g, b) > 210 and (max(r, g, b) - min(r, g, b)) < 30:
        return True
    return False


def punch(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    seen = [[False] * h for _ in range(w)]
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            q.append((x, y))
            seen[x][y] = True
    for y in range(h):
        for x in (0, w - 1):
            if not seen[x][y]:
                q.append((x, y))
                seen[x][y] = True
    kill: set[tuple[int, int]] = set()
    while q:
        x, y = q.popleft()
        r, g, b, _ = px[x, y]
        if not is_plate(r, g, b):
            continue
        kill.add((x, y))
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[nx][ny]:
                seen[nx][ny] = True
                nr, ng, nb, _ = px[nx, ny]
                if is_plate(nr, ng, nb):
                    q.append((nx, ny))
    for x, y in kill:
        px[x, y] = (0, 0, 0, 0)
    bbox = im.getbbox()
    if bbox:
        pad = 8
        x0, y0, x1, y1 = bbox
        im = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad)))
    return im


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for d in DOMAINS:
        src = SRC / f"domain-planet-{d}.png"
        if not src.exists():
            print("MISSING", src)
            continue
        im = punch(Image.open(src))
        png = OUT / f"{d}.png"
        webp = OUT / f"{d}.webp"
        im2 = im.copy()
        im2.thumbnail((512, 512), Image.Resampling.LANCZOS)
        im2.save(png, optimize=True, compress_level=9)
        im3 = im.copy()
        im3.thumbnail((256, 256), Image.Resampling.LANCZOS)
        im3.save(webp, "WEBP", quality=85, method=4)
        print(d, "png", png.stat().st_size, "webp", webp.stat().st_size, "corner", im2.getpixel((0, 0))[3])


if __name__ == "__main__":
    main()
