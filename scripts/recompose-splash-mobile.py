"""Recompose splash mobile art for full-bleed 9:16 phone screens.

The source assets keep ~600px of empty dark padding at the bottom and read as a
floating cut-out when CSS uses contain + a blurred cover underlay. This script
trims dead space, cover-crops to 1080x1920, and adds a soft bottom vignette for
the menu buttons.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'public' / 'Assets'
TARGET = (1080, 1920)
BG = (5, 5, 15)


def content_bottom(im: Image.Image, threshold: float = 18.0) -> int:
    px = im.load()
    w, h = im.size
    for y in range(h - 1, -1, -4):
        row = [sum(px[x, y][:3]) / 3 for x in range(0, w, max(1, w // 48))]
        if sum(row) / len(row) > threshold:
            return min(h, y + 24)
    return h


def cover_crop(im: Image.Image, size: tuple[int, int], focus_y: float = 0.46) -> Image.Image:
    tw, th = size
    sw, sh = im.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    scaled = im.resize((nw, nh), Image.LANCZOS)
    x0 = max(0, min(nw - tw, int((nw - tw) / 2)))
    y1 = int(nh * focus_y)
    y0 = max(0, min(nh - th, y1 - th // 2))
    return scaled.crop((x0, y0, x0 + tw, y0 + th))


def bottom_vignette(im: Image.Image, start: float = 0.58, end: float = 1.0, alpha: int = 150) -> Image.Image:
    out = im.copy()
    overlay = Image.new('RGBA', im.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    w, h = im.size
    y0 = int(h * start)
    for y in range(y0, h):
        t = (y - y0) / max(1, h - y0)
        a = int(alpha * t)
        draw.line([(0, y), (w, y)], fill=(5, 5, 15, a))
    return Image.alpha_composite(out.convert('RGBA'), overlay)


def recompose(src: Path, dest: Path) -> None:
    im = Image.open(src).convert('RGBA')
    bottom = content_bottom(im)
    trimmed = im.crop((0, 0, im.size[0], bottom))
    framed = cover_crop(trimmed, TARGET, focus_y=0.46)
    framed = bottom_vignette(framed)
    framed.save(dest, 'WEBP', quality=88, method=6)
    print(f'{dest.name}: {src.name} -> {TARGET[0]}x{TARGET[1]} (trimmed to y={bottom})')


def main() -> None:
    pairs = [
        ('splash-menu-mobile-en.webp', 'splash-menu-mobile-en.webp'),
        ('splash-menu-mobile-ar.webp', 'splash-menu-mobile-ar.webp'),
    ]
    for src_name, out_name in pairs:
        src = ASSETS / src_name
        if not src.exists():
            print(f'skip missing {src}')
            continue
        backup = ASSETS / out_name.replace('.webp', '.orig.webp')
        if not backup.exists():
            src.replace(backup)
            print(f'backup -> {backup.name}')
            src = backup
        recompose(src, ASSETS / out_name)


if __name__ == '__main__':
    main()
