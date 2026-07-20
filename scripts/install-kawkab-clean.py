"""Install clean Kawkab art and punch solid black / plate / checkerboard to alpha."""
from __future__ import annotations

import shutil
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC_CANDIDATES = [
    Path(r"C:\Users\user\.cursor\projects\c-Users-user-OneDrive-Documents-maze-man-comics\assets\kawkab-idle-clean.png"),
    ROOT / "assets" / "kawkab-idle-clean.png",
]
OUT_DIR = ROOT / "public" / "Assets" / "characters" / "kawkab"
IDLE = OUT_DIR / "kawkab-idle.png"
FACE = OUT_DIR / "kawkab-face.png"


def is_plate(r: int, g: int, b: int) -> bool:
    mx, mn = max(r, g, b), min(r, g, b)
    # Near-black void
    if mx < 28:
        return True
    # Near-white / light-gray plate
    if mn > 210 and (mx - mn) < 28:
        return True
    # Mid gray flat plate
    if mn > 150 and (mx - mn) < 18 and mx < 230:
        return True
    return False


def is_checker_cell(r: int, g: int, b: int) -> bool:
    """Transparency-grid cells: nearly neutral light or mid gray."""
    mx, mn = max(r, g, b), min(r, g, b)
    if (mx - mn) > 22:
        return False
    avg = (r + g + b) / 3
    return 140 <= avg <= 245


def punch(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    seen = [[False] * h for _ in range(w)]
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        for y in (0, h - 1):
            if not seen[x][y]:
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
        if not (is_plate(r, g, b) or is_checker_cell(r, g, b)):
            continue
        kill.add((x, y))
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[nx][ny]:
                seen[nx][ny] = True
                nr, ng, nb, _ = px[nx, ny]
                if is_plate(nr, ng, nb) or is_checker_cell(nr, ng, nb):
                    q.append((nx, ny))

    for x, y in kill:
        px[x, y] = (0, 0, 0, 0)

    # Soften fringe next to transparent
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if max(r, g, b) < 55 or (min(r, g, b) > 195 and (max(r, g, b) - min(r, g, b)) < 30):
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0:
                        px[x, y] = (r, g, b, max(0, a - 180))
                        break

    bbox = im.getbbox()
    if bbox:
        pad = 8
        x0, y0, x1, y1 = bbox
        im = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad)))

    im.thumbnail((640, 640), Image.Resampling.LANCZOS)
    return im


def main() -> None:
    src = next((p for p in SRC_CANDIDATES if p.is_file()), None)
    if src is None:
        raise SystemExit(f"missing source art; tried: {SRC_CANDIDATES}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    raw = OUT_DIR / "kawkab-idle-raw.png"
    shutil.copy2(src, raw)

    idle = punch(Image.open(raw))
    idle.save(IDLE, optimize=True, compress_level=9)

    w, h = idle.size
    side = int(min(w, h) * 0.72)
    cx, cy = w // 2, int(h * 0.34)
    x0 = max(0, cx - side // 2)
    y0 = max(0, cy - side // 2)
    face = idle.crop((x0, y0, min(w, x0 + side), min(h, y0 + side)))
    face = face.resize((320, 320), Image.Resampling.LANCZOS)
    face.save(FACE, optimize=True, compress_level=9)

    print("src", src)
    print("idle", idle.size, IDLE.stat().st_size, "cornerA", idle.getpixel((0, 0))[3])
    print("face", face.size, FACE.stat().st_size)


if __name__ == "__main__":
    main()
