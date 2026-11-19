# Ritar appens logga: sex noder i en ring (grupperna) som alla är kopplade till en gemensam kärna (allmänningen).
# Skapar icon.svg och PNG-ikoner för mobilen.  Kör: python3 tools/make-icons.py
import math
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
BG, FG, CORE = '#2f6b4f', '#f4efe3', '#e9b949'

def geometry(size):
    c = size / 2
    R = size * 0.265          # ringens radie
    nodes = [(c + R * math.cos(math.radians(-90 + 60 * i)), c + R * math.sin(math.radians(-90 + 60 * i))) for i in range(6)]
    return c, nodes, size * 0.068, size * 0.105, size * 0.034   # mitt, noder, nodradie, kärnradie, linjebredd

def svg(size=512, rounded=True):
    c, nodes, r, rc, w = geometry(size)
    ring = ' '.join(f'{x:.1f},{y:.1f}' for x, y in nodes)
    spokes = ''.join(f'<line x1="{c}" y1="{c}" x2="{x:.1f}" y2="{y:.1f}"/>' for x, y in nodes)
    dots = ''.join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}"/>' for x, y in nodes)
    rx = size * 0.22 if rounded else 0
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}">'
            f'<rect width="{size}" height="{size}" rx="{rx:.0f}" fill="{BG}"/>'
            f'<g stroke="{FG}" stroke-width="{w:.1f}" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".55">'
            f'<polygon points="{ring}"/>{spokes}</g>'
            f'<g fill="{FG}">{dots}</g><circle cx="{c}" cy="{c}" r="{rc:.1f}" fill="{CORE}"/></svg>')

def png(size, rounded):
    S = size * 4  # rita stort och skala ner för mjuka kanter
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c, nodes, r, rc, w = geometry(S)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=S * 0.22 if rounded else 0, fill=BG)
    lines = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lines)
    for i, p in enumerate(nodes):
        ld.line([p, nodes[(i + 1) % 6]], fill=FG, width=int(w))
        ld.line([(c, c), p], fill=FG, width=int(w))
        for q in (p, (c, c)):
            ld.ellipse([q[0] - w / 2, q[1] - w / 2, q[0] + w / 2, q[1] + w / 2], fill=FG)
    alpha = lines.getchannel('A').point(lambda a: int(a * 0.55))
    lines.putalpha(alpha)
    img.alpha_composite(lines)
    d = ImageDraw.Draw(img)
    for x, y in nodes:
        d.ellipse([x - r, y - r, x + r, y + r], fill=FG)
    d.ellipse([c - rc, c - rc, c + rc, c + rc], fill=CORE)
    return img.resize((size, size), Image.LANCZOS)

(ROOT / 'icon.svg').write_text(svg())
png(192, True).save(ROOT / 'icons/icon-192.png')
png(512, True).save(ROOT / 'icons/icon-512.png')
png(512, False).save(ROOT / 'icons/maskable-512.png')        # Android beskär själv
png(180, False).convert('RGB').save(ROOT / 'icons/apple-touch-icon.png')  # iPhone rundar själv hörnen
png(32, True).save(ROOT / 'icons/favicon-32.png')
print('ikoner klara')
