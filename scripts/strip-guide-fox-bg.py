"""Cut guide-fox-3d.png to transparent PNG — grow fox from seeds, trim debris."""
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'Assets' / 'guide-fox-3d.png'
ORIGINAL = Path(
    r'C:\Users\user\.cursor\projects\c-Users-user-OneDrive-Documents-maze-man-comics\assets\fox-smart-toon-dark.png'
)


def sample_bg_color(px, w, h):
    points = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    br = bg = bb = 0
    for x, y in points:
        r, g, b, _ = px[x, y]
        br += r
        bg += g
        bb += b
    return br // 4, bg // 4, bb // 4


def is_gold(r, g, b):
    return max(r, g, b) > 85 or (r > 55 and g > 45 and b < 90)


def gold_bounds(px, w, h):
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            if is_gold(r, g, b):
                xs.append(x)
                ys.append(y)
    if not xs:
        return 0, 0, w - 1, h - 1
    return min(xs), min(ys), max(xs), max(ys)


def grow_fox_mask(px, w, h, br, bg, bb, dark_tolerance=38):
    def near_bg(r, g, b):
        return max(abs(r - br), abs(g - bg), abs(b - bb)) <= dark_tolerance

    fg = bytearray(w * h)
    q = deque()
    cx, cy = w // 2, h // 2

    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            if is_gold(r, g, b):
                idx = y * w + x
                fg[idx] = 1
                q.append((x, y))

    for dy in range(-100, 160):
        y = cy + dy
        if 0 <= y < h:
            r, g, b, _ = px[cx, y]
            if near_bg(r, g, b) or is_gold(r, g, b):
                idx = y * w + cx
                if not fg[idx]:
                    fg[idx] = 1
                    q.append((cx, y))
                break

    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if nx < 0 or nx >= w or ny < 0 or ny >= h:
                continue
            idx = ny * w + nx
            if fg[idx]:
                continue
            r, g, b, _ = px[nx, ny]
            if is_gold(r, g, b) or near_bg(r, g, b):
                fg[idx] = 1
                q.append((nx, ny))

    return fg


def strip_background(img: Image.Image) -> Image.Image:
    rgba = img.convert('RGBA')
    w, h = rgba.size
    px = rgba.load()
    br, bg, bb = sample_bg_color(px, w, h)

    fg = grow_fox_mask(px, w, h, br, bg, bb)
    gx0, gy0, gx1, gy1 = gold_bounds(px, w, h)
    pad_x, pad_y = 90, 70
    bx0 = max(0, gx0 - pad_x)
    by0 = max(0, gy0 - pad_y)
    bx1 = min(w - 1, gx1 + pad_x)
    by1 = min(h - 1, gy1 + pad_y)

    for y in range(h):
        for x in range(w):
            if not fg[y * w + x]:
                px[x, y] = (px[x, y][0], px[x, y][1], px[x, y][2], 0)
                continue
            if x < bx0 or x > bx1 or y < by0 or y > by1:
                px[x, y] = (px[x, y][0], px[x, y][1], px[x, y][2], 0)

    return rgba


def main():
    src = ORIGINAL if ORIGINAL.exists() else OUT
    out = strip_background(Image.open(src))
    out.save(OUT, optimize=True)

    px = out.load()
    w, h = out.size
    ys = [y for y in range(h) for x in range(w) if px[x, y][3] > 0]
    holes = sum(1 for y in range(860, h) if px[w // 2, y][3] == 0)
    bl = sum(1 for x in range(100) for y in range(h - 50, h) if px[x, y][3] > 0)
    print(f'Wrote transparent asset: {OUT}')
    print(f'Opaque rows: {min(ys)}–{max(ys)}; lower-center holes: {holes}; corner debris: {bl}')


if __name__ == '__main__':
    main()
