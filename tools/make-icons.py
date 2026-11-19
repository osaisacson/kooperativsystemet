# Ritar appens logga: en grön ring på ljust mintgrön botten.
# Skapar icon.svg och PNG-ikoner för mobilen.  Kör: python3 tools/make-icons.py
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
BG = '#e8f9e9'                      # mint
LIGHT, DARK = (134, 207, 108), (40, 170, 110)   # ringens toning: ljust lime → grönt
RING_R, RING_W = 0.30, 0.115        # ytterradie och tjocklek, andel av bredden

def svg(size=512, rounded=True):
    c, r, w = size / 2, size * (RING_R - RING_W / 2), size * RING_W
    rx = size * 0.22 if rounded else 0
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}">'
            f'<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
            f'<stop offset="0" stop-color="rgb{LIGHT}"/><stop offset="1" stop-color="rgb{DARK}"/></linearGradient></defs>'
            f'<rect width="{size}" height="{size}" rx="{rx:.0f}" fill="{BG}"/>'
            f'<circle cx="{c}" cy="{c}" r="{r:.1f}" fill="none" stroke="url(#g)" stroke-width="{w:.1f}"/></svg>')

def png(size, rounded):
    S = size * 4  # rita stort och skala ner för mjuka kanter
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(img).rounded_rectangle([0, 0, S - 1, S - 1], radius=S * 0.22 if rounded else 0, fill=BG)
    # diagonal toning, maskad till en ring
    grad = Image.new('RGBA', (S, S))
    gp = grad.load()
    for y in range(S):
        for x in range(0, S, 4):
            t = (x + y) / (2 * S)
            col = tuple(int(LIGHT[i] + (DARK[i] - LIGHT[i]) * t) for i in range(3)) + (255,)
            for dx in range(4):
                if x + dx < S: gp[x + dx, y] = col
    mask = Image.new('L', (S, S), 0)
    md = ImageDraw.Draw(mask)
    c, ro, ri = S / 2, S * RING_R, S * (RING_R - RING_W)
    md.ellipse([c - ro, c - ro, c + ro, c + ro], fill=255)
    md.ellipse([c - ri, c - ri, c + ri, c + ri], fill=0)
    img.paste(grad, (0, 0), mask)
    return img.resize((size, size), Image.LANCZOS)

(ROOT / 'icon.svg').write_text(svg())
png(192, True).save(ROOT / 'icons/icon-192.png')
png(512, True).save(ROOT / 'icons/icon-512.png')
png(512, False).save(ROOT / 'icons/maskable-512.png')                   # Android beskär själv
png(180, False).convert('RGB').save(ROOT / 'icons/apple-touch-icon.png')  # iPhone rundar själv hörnen
png(32, True).save(ROOT / 'icons/favicon-32.png')
print('ikoner klara')
