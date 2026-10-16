"""Generate original mandala coloring pages and package each as an A4 PDF.

Originals only — no third-party artwork. Run:
    python scripts/gen_mandalas.py [count] [outdir]
"""
import math
import random
import sys
import os
from PIL import Image, ImageDraw

# A4 @ 300 DPI portrait
W, H = 2480, 3508
CX, CY = W // 2, H // 2 - 120      # center slightly above middle for margin
MAXR = int(W * 0.45)
LINE = 8
BG, FG = "white", "black"


def rot(x, y, ang):
    c, s = math.cos(ang), math.sin(ang)
    return CX + (x * c - y * s), CY + (x * s + y * c)


def teardrop(d, r0, r1, angle, half, lw=LINE):
    pts = []
    steps = 28
    for i in range(steps + 1):
        t = i / steps
        ang = -half + 2 * half * t
        rr = r0 + (r1 - r0) * math.sin(math.pi * t) ** 0.6
        pts.append((rr * math.cos(ang), rr * math.sin(ang)))
    d.line([rot(px, py, angle) for px, py in pts], fill=FG, width=lw, joint="curve")


def leaf(d, r0, r1, angle, half, lw=LINE):
    """Pointed leaf (both ends tapered)."""
    pts = []
    steps = 30
    for i in range(steps + 1):
        t = i / steps
        ang = -half + 2 * half * t
        rr = r0 + (r1 - r0) * t
        bulge = math.sin(math.pi * t) ** 0.5
        pts.append((rr * math.cos(ang - half * 0.0) * bulge * 0 +
                    (r0 + (r1 - r0) * t) * math.cos(ang),
                    (r0 + (r1 - r0) * t) * math.sin(ang)))
    d.line([rot(px, py, angle) for px, py in pts], fill=FG, width=lw, joint="curve")


def heart(d, radius, angle, size, lw=LINE):
    pts = []
    steps = 48
    for i in range(steps + 1):
        t = i / steps * 2 * math.pi
        x = 16 * math.sin(t) ** 3
        y = -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
        pts.append((x / 16 * size + radius, y / 16 * size))
    d.line([rot(px, py, angle) for px, py in pts], fill=FG, width=lw, joint="curve")


def diamond(d, radius, angle, s, lw=LINE):
    x, y = rot(radius, 0, angle)
    d.polygon([(x, y - s), (x + s, y), (x, y + s), (x - s, y)], outline=FG, width=lw)


def circle_at(d, radius, angle, r, lw=LINE):
    x, y = rot(radius, 0, angle)
    d.ellipse([x - r, y - r, x + r, y + r], outline=FG, width=lw)


def scallop_ring(d, r, count, lw=LINE):
    step = 2 * math.pi / count
    half = step * 0.5
    for i in range(count):
        a = i * step
        # outward bump
        pts = []
        steps = 20
        for s in range(steps + 1):
            t = s / steps
            ang = -half + 2 * half * t
            rr = r + (r * 0.06) * math.sin(math.pi * t)
            pts.append((rr * math.cos(ang), rr * math.sin(ang)))
        d.line([rot(px, py, a) for px, py in pts], fill=FG, width=lw, joint="curve")


def make_mandala(seed, png_path, pdf_path, title):
    rng = random.Random(seed)
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # outer double frame
    d.ellipse([CX - MAXR, CY - MAXR, CX + MAXR, CY + MAXR], outline=FG, width=LINE + 3)
    d.ellipse([CX - MAXR + 26, CY - MAXR + 26, CX + MAXR - 26, CY + MAXR - 26],
              outline=FG, width=LINE)

    fracs = [0.96, 0.87, 0.78, 0.69, 0.60, 0.51, 0.42, 0.33, 0.24, 0.15, 0.07]
    radii = [int(MAXR * f) for f in fracs]

    for idx in range(len(radii) - 1):
        r_out, r_in = radii[idx], radii[idx + 1]
        band = r_out - r_in
        d.ellipse([CX - r_out, CY - r_out, CX + r_out, CY + r_out], outline=FG, width=LINE)
        if band < 46:
            continue

        mid = (r_out + r_in) // 2
        count = rng.choice([10, 12, 14, 16, 18, 20, 24])
        style = rng.choice(["teardrop", "leaf", "heart", "diamond", "circle", "scallop"])

        if style == "teardrop":
            for i in range(count):
                a = i * 2 * math.pi / count
                teardrop(d, r_in + 8, r_out - 8, a, (2 * math.pi / count) * 0.35)
        elif style == "leaf":
            for i in range(count):
                a = i * 2 * math.pi / count
                teardrop(d, r_in + 8, r_out - 8, a, (2 * math.pi / count) * 0.3)
        elif style == "heart" and band > 100:
            for i in range(count):
                a = i * 2 * math.pi / count
                heart(d, mid, a, band * 0.42)
        elif style == "diamond" and band > 70:
            for i in range(count):
                diamond(d, mid, i * 2 * math.pi / count, band * 0.32)
        elif style == "circle" and band > 70:
            for i in range(count):
                circle_at(d, mid, i * 2 * math.pi / count, band * 0.28)
        elif style == "scallop":
            scallop_ring(d, r_out - 12, count * 2)
        else:
            for i in range(max(count, 20)):
                circle_at(d, mid, i * 2 * math.pi / max(count, 20), LINE * 2)

        # occasional radial spokes
        if rng.random() < 0.35:
            spokes = count * 2
            for s in range(spokes):
                a = s * 2 * math.pi / spokes
                x0, y0 = rot(r_in, 0, a)
                x1, y1 = rot(r_out - 6, 0, a)
                d.line([x0, y0, x1, y1], fill=FG, width=max(3, LINE - 4))

    # center flower
    cr = radii[-1] + 40
    d.ellipse([CX - cr, CY - cr, CX + cr, CY + cr], outline=FG, width=LINE)
    for p in range(10):
        a = p * 2 * math.pi / 10
        teardrop(d, 40, cr - 6, a, 0.22)
    d.ellipse([CX - 46, CY - 46, CX + 46, CY + 46], outline=FG, width=LINE)

    # title footer
    d.text((CX, H - 140), title, fill=FG, anchor="mm")

    img.save(png_path, "PNG", optimize=True)
    # A4 pdf
    img.resize((2480, 3508)).save(pdf_path, "PDF", resolution=300.0)
    return png_path, pdf_path


NAMES = [
    "Lotus Calm", "Starburst Bloom", "Sunwheel", "Petals & Dots",
    "Sacred Geometry", "Radiant Heart", "Moon Garden", "Zen Wheel",
    "Blossom Ring", "Crystal Bloom", "Harmony", "Tranquility",
    "Radiance", "Serenity", "Celestial Bloom", "Peaceful Petals",
    "Golden Hour", "Still Waters", "Morning Dew", "Evening Calm",
]

if __name__ == "__main__":
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 12
    outdir = sys.argv[2] if len(sys.argv) > 2 else "scripts/out_mandalas"
    pdfdir = os.path.join(outdir, "pdf")
    os.makedirs(pdfdir, exist_ok=True)
    for i in range(count):
        name = NAMES[i % len(NAMES)]
        png = os.path.join(outdir, f"mandala_{i+1:02d}.png")
        pdf = os.path.join(pdfdir, f"{name.lower().replace(' ', '-')}.pdf")
        make_mandala(1000 + i * 13, png, pdf, name)
        print(f"{i+1:02d}  {name:18s} -> {png}  |  {pdf}")
