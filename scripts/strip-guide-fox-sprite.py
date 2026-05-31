"""Convert guide fox sprite source to true transparent PNG."""
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(
    r'C:\Users\user\.cursor\projects\c-Users-user-OneDrive-Documents-maze-man-comics\assets\guide-fox-sprite-source-v2.png'
)
OUT = ROOT / 'public' / 'Assets' / 'guide-fox-sprite.png'


def is_bg_pixel(r, g, b):
    """Checkerboard / flat studio backdrop."""
    if max(r, g, b) < 145:
        return False
    if abs(r - g) <= 18 and abs(g - b) <= 18:
        return True
    return max(r, g, b) >= 230


def is_gold_eye(r, g, b):
    return r > 120 and g > 70 and b < 110 and r > b + 30


def grow_fox_mask(px, w, h):
    br, bg, bb = 12, 12, 12
    fg = bytearray(w * h)
    q = deque()
    cx, cy = w // 2, h // 2

    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            if is_gold_eye(r, g, b):
                idx = y * w + x
                fg[idx] = 1
                q.append((x, y))

    for dy in range(-120, 180):
        y = cy + dy
        if 0 <= y < h:
            r, g, b, _ = px[cx, y]
            if max(r, g, b) < 140 or is_gold_eye(r, g, b):
                idx = y * w + cx
                if not fg[idx]:
                    fg[idx] = 1
                    q.append((cx, y))
                break

    def body_like(r, g, b):
        if is_gold_eye(r, g, b):
            return True
        if is_bg_pixel(r, g, b):
            return False
        return max(r, g, b) < 150 or max(abs(r - br), abs(g - bg), abs(b - bb)) <= 55

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


def strip_sprite(img: Image.Image) -> Image.Image:
    rgba = img.convert('RGBA')
    w, h = rgba.size
    px = rgba.load()

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_bg_pixel(r, g, b):
                px[x, y] = (r, g, b, 0)

    fg = grow_fox_mask(px, w, h)
    gx0 = gy0 = w
    gx1 = gy1 = 0
    for y in range(h):
        for x in range(w):
            if fg[y * w + x]:
                gx0 = min(gx0, x)
                gy0 = min(gy0, y)
                gx1 = max(gx1, x)
                gy1 = max(gy1, y)

    pad = 12
    pad_bottom = 36
    bx0 = max(0, gx0 - pad)
    by0 = max(0, gy0 - pad)
    bx1 = min(w - 1, gx1 + pad)
    by1 = min(h - 1, gy1 + pad_bottom)

    for y in range(h):
        for x in range(w):
            if not fg[y * w + x]:
                px[x, y] = (px[x, y][0], px[x, y][1], px[x, y][2], 0)
            elif x < bx0 or x > bx1 or y < by0 or y > by1:
                px[x, y] = (px[x, y][0], px[x, y][1], px[x, y][2], 0)

    return rgba.crop((bx0, by0, bx1 + 1, by1 + 1))


def main():
    out = strip_sprite(Image.open(SRC))
    out.save(OUT, optimize=True)
    px = out.load()
    w, h = out.size
    holes = sum(1 for y in range(int(h * 0.65), h) if px[w // 2, y][3] == 0)
    print(f'Saved {OUT} ({w}x{h}), lower-center holes={holes}')


if __name__ == '__main__':
    main()
