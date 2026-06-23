"""Remove side planets from the original 1080×1920 splash — same framing, no zoom.

Reads `*.orig.webp` masters and writes cleaned mobile splash assets.
"""
from __future__ import annotations

import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'public' / 'Assets'
BG = (5, 5, 15)

# Measured from splash-menu-mobile-en.orig.webp
LEFT_CLEAN_ZONES = [
    (0, 0, 400, 540),      # orange planet + top-left golden orb bleed
    (0, 520, 330, 1130),   # grey moon + arc (blob x=0..236, y=600..1044)
]
LEFT_STRIP_PX = 120         # drop clipped left edge column


def dark_starfield_tile(im: Image.Image) -> Image.Image:
    """Darker starfield sample — avoids golden brain bokeh on the left fill."""
    w, h = im.size
    patch = im.crop((int(w * 0.35), int(h * 0.68), int(w * 0.88), int(h * 0.88)))
    dark = Image.eval(patch, lambda p: int(p * 0.42))
    return dark.resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(radius=3))


def build_mask(size: tuple[int, int]) -> Image.Image:
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    for x0, y0, x1, y1 in LEFT_CLEAN_ZONES:
        draw.rectangle((x0, y0, x1, y1), fill=255)
    return mask.filter(ImageFilter.GaussianBlur(radius=26))


def starfield_tile(im: Image.Image) -> Image.Image:
    w, h = im.size
    patch = im.crop((int(w * 0.50), int(h * 0.10), int(w * 0.94), int(h * 0.50)))
    return patch.resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(radius=2))


def sprinkle_stars(layer: Image.Image, mask: Image.Image, count: int = 480) -> None:
    px = layer.load()
    mpx = mask.load()
    w, h = layer.size
    rng = random.Random(7)
    for _ in range(count):
        x, y = rng.randint(0, w - 1), rng.randint(0, h - 1)
        if mpx[x, y] < 28:
            continue
        b = rng.randint(28, 165)
        if rng.random() > 0.88:
            px[x, y] = (255, 228, 160, rng.randint(60, 210))
        else:
            px[x, y] = (b, b, b, rng.randint(45, 180))


def starfield_fill(im: Image.Image, mask: Image.Image) -> Image.Image:
    rgba = im.convert('RGBA')
    patch = dark_starfield_tile(rgba)
    blurred = rgba.filter(ImageFilter.GaussianBlur(radius=22))
    fill = Image.composite(patch, blurred, mask)
    sprinkle_stars(fill, mask, count=320)
    return Image.composite(fill, rgba, mask)


def calm_left_edge(im: Image.Image) -> Image.Image:
    """Remove bright left-edge blobs that read as a cut-off planet on phones."""
    rgba = im.convert('RGBA')
    px = rgba.load()
    w, h = rgba.size
    for y in range(580, 1020):
        for x in range(0, 150):
            r, g, b, a = px[x, y]
            lum = (r + g + b) / 3
            if lum < 95:
                continue
            fade = 1 - (x / 150) * 0.35
            dim = 0.28 + (1 - min(lum, 255) / 255) * 0.22
            scale = dim * fade
            px[x, y] = (
                int(r * scale),
                int(g * scale),
                int(b * scale),
                a,
            )
    return rgba


def drop_left_strip(im: Image.Image, strip: int) -> Image.Image:
    """Remove the clipped left edge; pad the right with matching starfield."""
    w, h = im.size
    if strip <= 0 or strip >= w - 100:
        return im
    core = im.crop((strip, 0, w, h))
    canvas = Image.new('RGBA', (w, h), BG + (255,))
    canvas.paste(core, (0, 0))
    pad = Image.new('RGBA', (strip, h), BG + (255,))
    tile = starfield_tile(im).crop((0, 0, strip, h))
    pad = Image.alpha_composite(pad, tile)
    sprinkle_stars(pad, Image.new('L', (strip, h), 255), count=120)
    canvas.paste(pad, (w - strip, 0), pad)
    return canvas


def clean(im: Image.Image) -> Image.Image:
    mask = build_mask(im.size)
    filled = starfield_fill(im, mask)
    filled = calm_left_edge(filled)
    return drop_left_strip(filled, LEFT_STRIP_PX)


def main() -> None:
    for name in ('splash-menu-mobile-en.webp', 'splash-menu-mobile-ar.webp'):
        backup = ASSETS / name.replace('.webp', '.orig.webp')
        src = backup if backup.exists() else ASSETS / name
        if not src.exists():
            print(f'skip {src.name}')
            continue
        out = clean(Image.open(src))
        out.save(ASSETS / name, 'WEBP', quality=90, method=6)
        print(f'{name} <- {src.name} ({out.size[0]}x{out.size[1]})')


if __name__ == '__main__':
    main()
