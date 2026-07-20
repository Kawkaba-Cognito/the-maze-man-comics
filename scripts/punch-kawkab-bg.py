"""Punch near-black / near-white plate out of Kawkab idle + rebuild face crop."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IDLE = ROOT / "public" / "Assets" / "characters" / "kawkab" / "kawkab-idle.png"
FACE = ROOT / "public" / "Assets" / "characters" / "kawkab" / "kawkab-face.png"


def is_plate(r: int, g: int, b: int) -> bool:
    # Dark void plate OR leftover light/grey fringe from export
    if max(r, g, b) < 52:
        return True
    if min(r, g, b) > 200 and (max(r, g, b) - min(r, g, b)) < 36:
        return True
    if r > 185 and g > 185 and b > 185 and abs(r - g) < 24 and abs(g - b) < 24:
        return True
    # Baked “checkerboard transparency” (light + mid-grey neighbors)
    if 150 < r < 245 and 150 < g < 245 and 150 < b < 245 and (max(r, g, b) - min(r, g, b)) < 22:
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
        r, g, b, _a = px[x, y]
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

    # Soften fringe next to transparent
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if max(r, g, b) < 70 or (min(r, g, b) > 200):
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0:
                        px[x, y] = (r, g, b, max(0, a - 160))
                        break

    bbox = im.getbbox()
    if bbox:
        pad = 10
        x0, y0, x1, y1 = bbox
        x0 = max(0, x0 - pad)
        y0 = max(0, y0 - pad)
        x1 = min(w, x1 + pad)
        y1 = min(h, y1 + pad)
        im = im.crop((x0, y0, x1, y1))

    im.thumbnail((640, 640), Image.Resampling.LANCZOS)
    return im


def main() -> None:
    idle = punch(Image.open(IDLE))
    idle.save(IDLE, optimize=True, compress_level=9)

    w, h = idle.size
    side = int(min(w, h) * 0.72)
    cx, cy = w // 2, int(h * 0.34)
    x0 = max(0, cx - side // 2)
    y0 = max(0, cy - side // 2)
    face = idle.crop((x0, y0, min(w, x0 + side), min(h, y0 + side)))
    face = face.resize((320, 320), Image.Resampling.LANCZOS)
    face.save(FACE, optimize=True, compress_level=9)

    print("idle", idle.size, IDLE.stat().st_size, "cornerA", idle.getpixel((0, 0))[3])
    print("face", face.size, FACE.stat().st_size)


if __name__ == "__main__":
    main()
