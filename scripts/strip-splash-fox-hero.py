"""Cut splash fox hero to transparent PNG."""
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(
    r'C:\Users\user\.cursor\projects\c-Users-user-OneDrive-Documents-maze-man-comics\assets\splash-fox-hero-source.png'
)
OUT = ROOT / 'public' / 'Assets' / 'splash-fox-hero.png'


def is_bg_pixel(r, g, b):
    if max(r, g, b) < 145:
        return False
    if abs(r - g) <= 22 and abs(g - b) <= 22:
        return True
    return max(r, g, b) >= 228


def is_accent(r, g, b):
    return r > 120 and g > 70 and b < 120 and r > b + 25


def grow_mask(px, w, h):
    br, bg, bb = 12, 12, 12
    fg = bytearray(w * h)
    q = deque()
    cx, cy = w // 2, h // 2

    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            if is_accent(r, g, b) or (max(r, g, b) > 90 and g > 50):
                idx = y * w + x
                fg[idx] = 1
                q.append((x, y))

    for dy in range(-140, 180):
        y = cy + dy
        if 0 <= y < h:
            r, g, b, _ = px[cx, y]
            if max(r, g, b) < 160 or is_accent(r, g, b):
                idx = y * w + cx
                if not fg[idx]:
                    fg[idx] = 1
                    q.append((cx, y))
                break

    def body_like(r, g, b):
        if is_accent(r, g, b):
            return True
        if is_bg_pixel(r, g, b):
            return False
        if max(r, g, b) > 55:
            return True
        return max(abs(r - br), abs(g - bg), abs(b - bb)) <= 58

    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if nx < 0 or nx >= w or ny < 0 or ny >= h:
                continue
            idx = ny * w + nx
            if fg[idx]:
                continue
            r, g, b, _ = px[nx, ny]
            if body_like(r, g, b):
                fg[idx] = 1
                q.append((nx, ny))
    return fg


def main():
    rgba = Image.open(SRC).convert('RGBA')
    w, h = rgba.size
    px = rgba.load()

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_bg_pixel(r, g, b):
                px[x, y] = (r, g, b, 0)

    fg = grow_mask(px, w, h)
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            if fg[y * w + x]:
                xs.append(x)
                ys.append(y)

    pad = 16
    x0, x1 = max(0, min(xs) - pad), min(w - 1, max(xs) + pad)
    y0, y1 = max(0, min(ys) - pad), min(h - 1, max(ys) + pad)

    for y in range(h):
        for x in range(w):
            if not fg[y * w + x] or x < x0 or x > x1 or y < y0 or y > y1:
                px[x, y] = (px[x, y][0], px[x, y][1], px[x, y][2], 0)

    out = rgba.crop((x0, y0, x1 + 1, y1 + 1))
    out.save(OUT, optimize=True)
    print(f'Saved {OUT} ({out.size[0]}x{out.size[1]})')


if __name__ == '__main__':
    main()
