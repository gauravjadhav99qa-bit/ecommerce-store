"""Generate original kid-friendly coloring pages (thick outlines, big shapes)
and package each as an A4 PDF. Originals only — no third-party artwork.

Run:
    python scripts/gen_kids.py [count] [outdir]
"""
import math
import os
import sys
from PIL import Image, ImageDraw

# A4 @ 300 DPI portrait
W, H = 2480, 3508
BG, FG = "white", "black"
LINE = 26  # very thick, easy for small hands

OUT: dict = {}


def new_page():
    img = Image.new("RGB", (W, H), BG)
    return img, ImageDraw.Draw(img)


def footer(d, title):
    d.text((W // 2, H - 170), title, fill=FG, anchor="mm")


# ---------- simple, high-recognition subjects ----------

def sun():
    img, d = new_page()
    cx, cy, r = W // 2, H // 2 - 150, 620
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=FG, width=LINE)
    # rays
    for i in range(12):
        a = i * math.pi / 6
        x0, y0 = cx + math.cos(a) * (r + 60), cy + math.sin(a) * (r + 60)
        x1, y1 = cx + math.cos(a) * (r + 360), cy + math.sin(a) * (r + 360)
        d.line([x0, y0, x1, y1], fill=FG, width=LINE)
    # face
    d.ellipse([cx - 260, cy - 220, cx - 120, cy - 40], outline=FG, width=LINE)
    d.ellipse([cx + 120, cy - 220, cx + 260, cy - 40], outline=FG, width=LINE)
    d.arc([cx - 220, cy - 40, cx + 220, cy + 260], 20, 160, fill=FG, width=LINE)
    footer(d, "Happy Sun")
    return img


def house():
    img, d = new_page()
    d.polygon([(400, 1500), (1240, 700), (2080, 1500)], outline=FG, width=LINE)
    d.rectangle([560, 1500, 1920, 2700], outline=FG, width=LINE)
    d.rectangle([1050, 2050, 1430, 2700], outline=FG, width=LINE)  # door
    d.ellipse([1370, 2350, 1410, 2400], fill=FG)
    # windows
    d.rectangle([720, 1750, 1040, 2070], outline=FG, width=LINE)
    d.line([880, 1750, 880, 2070], fill=FG, width=LINE)
    d.line([720, 1910, 1040, 1910], fill=FG, width=LINE)
    d.rectangle([1440, 1750, 1760, 2070], outline=FG, width=LINE)
    d.line([1600, 1750, 1600, 2070], fill=FG, width=LINE)
    d.line([1440, 1910, 1760, 1910], fill=FG, width=LINE)
    # chimney
    d.rectangle([1650, 850, 1820, 1200], outline=FG, width=LINE)
    footer(d, "My House")
    return img


def cat():
    img, d = new_page()
    cx = W // 2
    d.ellipse([cx - 560, 700, cx + 560, 1820], outline=FG, width=LINE)  # head
    # ears
    d.polygon([(cx - 520, 900), (cx - 360, 520), (cx - 160, 820)], outline=FG, width=LINE)
    d.polygon([(cx + 520, 900), (cx + 360, 520), (cx + 160, 820)], outline=FG, width=LINE)
    # eyes
    d.ellipse([cx - 300, 1050, cx - 120, 1290], outline=FG, width=LINE)
    d.ellipse([cx + 120, 1050, cx + 300, 1290], outline=FG, width=LINE)
    # nose + mouth
    d.polygon([(cx - 70, 1380), (cx + 70, 1380), (cx, 1500)], outline=FG, width=LINE)
    d.arc([cx - 180, 1440, cx, 1660], 0, 180, fill=FG, width=LINE)
    d.arc([cx, 1440, cx + 180, 1660], 0, 180, fill=FG, width=LINE)
    # whiskers
    for dy in (-60, 0, 60):
        d.line([cx - 300, 1450 + dy, cx - 640, 1400 + dy], fill=FG, width=LINE)
        d.line([cx + 300, 1450 + dy, cx + 640, 1400 + dy], fill=FG, width=LINE)
    # body
    d.ellipse([cx - 420, 1750, cx + 420, 2750], outline=FG, width=LINE)
    footer(d, "Cute Cat")
    return img


def butterfly():
    img, d = new_page()
    cx = W // 2
    d.ellipse([cx - 90, 900, cx + 90, 2200], outline=FG, width=LINE)  # body
    d.ellipse([cx - 60, 760, cx + 60, 940], outline=FG, width=LINE)  # head
    d.line([cx - 40, 780, cx - 160, 560], fill=FG, width=LINE)
    d.line([cx + 40, 780, cx + 160, 560], fill=FG, width=LINE)
    d.ellipse([cx - 190, 520, cx - 120, 600], fill=FG)
    d.ellipse([cx + 120, 520, cx + 190, 600], fill=FG)
    # wings
    d.ellipse([cx - 1050, 900, cx - 60, 1650], outline=FG, width=LINE)
    d.ellipse([cx + 60, 900, cx + 1050, 1650], outline=FG, width=LINE)
    d.ellipse([cx - 900, 1600, cx - 60, 2350], outline=FG, width=LINE)
    d.ellipse([cx + 60, 1600, cx + 900, 2350], outline=FG, width=LINE)
    # wing dots
    d.ellipse([cx - 700, 1150, cx - 400, 1450], outline=FG, width=LINE)
    d.ellipse([cx + 400, 1150, cx + 700, 1450], outline=FG, width=LINE)
    footer(d, "Butterfly")
    return img


def fish():
    img, d = new_page()
    cx, cy = W // 2, H // 2 - 100
    d.ellipse([cx - 800, cy - 480, cx + 500, cy + 480], outline=FG, width=LINE)  # body
    d.polygon([(cx + 500, cy), (cx + 950, cy - 380), (cx + 950, cy + 380)], outline=FG, width=LINE)  # tail
    d.ellipse([cx - 620, cy - 160, cx - 460, cy], outline=FG, width=LINE)  # eye
    d.ellipse([cx - 570, cy - 110, cx - 510, cy - 50], fill=FG)
    # fin
    d.polygon([(cx - 100, cy - 480), (cx + 150, cy - 760), (cx + 300, cy - 480)], outline=FG, width=LINE)
    # bubbles
    d.ellipse([cx - 1000, cy - 700, cx - 880, cy - 580], outline=FG, width=LINE)
    d.ellipse([cx - 1150, cy - 950, cx - 1060, cy - 860], outline=FG, width=LINE)
    footer(d, "Little Fish")
    return img


def flower():
    img, d = new_page()
    cx, cy = W // 2, H // 2 - 250
    # petals
    for i in range(6):
        a = i * math.pi / 3
        px, py = cx + math.cos(a) * 620, cy + math.sin(a) * 620
        d.ellipse([px - 360, py - 360, px + 360, py + 360], outline=FG, width=LINE)
    d.ellipse([cx - 360, cy - 360, cx + 360, cy + 360], outline=FG, width=LINE)  # center
    # stem + leaves
    d.line([cx, cy + 360, cx, 3050], fill=FG, width=LINE)
    d.ellipse([cx - 560, 2450, cx - 40, 2750], outline=FG, width=LINE)
    d.ellipse([cx + 40, 2650, cx + 560, 2950], outline=FG, width=LINE)
    footer(d, "Big Flower")
    return img


def car():
    img, d = new_page()
    y = H // 2 + 100
    d.rounded_rectangle([300, y - 260, 2180, y + 240], radius=120, outline=FG, width=LINE)  # body
    d.polygon([(700, y - 260), (900, y - 640), (1580, y - 640), (1780, y - 260)], outline=FG, width=LINE)  # cabin
    d.line([1240, y - 640, 1240, y - 260], fill=FG, width=LINE)
    # wheels
    d.ellipse([520, y + 120, 920, y + 520], outline=FG, width=LINE)
    d.ellipse([620, y + 220, 820, y + 420], outline=FG, width=LINE)
    d.ellipse([1560, y + 120, 1960, y + 520], outline=FG, width=LINE)
    d.ellipse([1660, y + 220, 1860, y + 420], outline=FG, width=LINE)
    # headlight + road
    d.ellipse([2080, y - 120, 2180, y - 20], fill=FG)
    d.line([200, y + 560, 2280, y + 560], fill=FG, width=LINE)
    footer(d, "My Car")
    return img


def rocket():
    img, d = new_page()
    cx = W // 2
    d.polygon([(cx, 500), (cx + 380, 1300), (cx + 380, 2200), (cx - 380, 2200), (cx - 380, 1300)], outline=FG, width=LINE)
    d.ellipse([cx - 180, 1250, cx + 180, 1610], outline=FG, width=LINE)  # window
    # fins
    d.polygon([(cx - 380, 1800), (cx - 720, 2350), (cx - 380, 2200)], outline=FG, width=LINE)
    d.polygon([(cx + 380, 1800), (cx + 720, 2350), (cx + 380, 2200)], outline=FG, width=LINE)
    # flame
    d.polygon([(cx - 200, 2200), (cx, 2750), (cx + 200, 2200)], outline=FG, width=LINE)
    # stars
    for (sx, sy) in [(500, 900), (1980, 1100), (700, 2600), (1900, 2600)]:
        d.ellipse([sx - 70, sy - 70, sx + 70, sy + 70], outline=FG, width=LINE)
    footer(d, "Space Rocket")
    return img


def tree():
    img, d = new_page()
    cx = W // 2
    d.rectangle([cx - 180, 2300, cx + 180, 3050], outline=FG, width=LINE)  # trunk
    d.ellipse([cx - 820, 1300, cx + 820, 2500], outline=FG, width=LINE)  # canopy
    d.ellipse([cx - 560, 800, cx + 560, 1700], outline=FG, width=LINE)
    # apples
    for (ax, ay) in [(cx - 400, 1700), (cx + 380, 1650), (cx - 100, 2050), (cx + 250, 2100)]:
        d.ellipse([ax - 90, ay - 90, ax + 90, ay + 90], outline=FG, width=LINE)
    footer(d, "Apple Tree")
    return img


def heart():
    img, d = new_page()
    cx, cy = W // 2, H // 2 - 100
    # two circles + triangle for a clean big heart
    d.ellipse([cx - 720, cy - 640, cx, cy + 80], outline=FG, width=LINE)
    d.ellipse([cx, cy - 640, cx + 720, cy + 80], outline=FG, width=LINE)
    d.polygon([(cx - 718, cy - 160), (cx, cy + 820), (cx + 718, cy - 160)], outline=FG, width=LINE)
    # inner face
    d.ellipse([cx - 300, cy - 260, cx - 120, cy - 60], outline=FG, width=LINE)
    d.ellipse([cx + 120, cy - 260, cx + 300, cy - 60], outline=FG, width=LINE)
    d.arc([cx - 180, cy - 40, cx + 180, cy + 300], 20, 160, fill=FG, width=LINE)
    footer(d, "Love Heart")
    return img


def star():
    img, d = new_page()
    cx, cy = W // 2, H // 2 - 100
    R, r = 900, 380
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rad = R if i % 2 == 0 else r
        pts.append((cx + math.cos(ang) * rad, cy + math.sin(ang) * rad))
    d.polygon(pts, outline=FG, width=LINE)
    # face
    d.ellipse([cx - 240, cy - 120, cx - 80, cy + 40], outline=FG, width=LINE)
    d.ellipse([cx + 80, cy - 120, cx + 240, cy + 40], outline=FG, width=LINE)
    d.arc([cx - 160, cy + 40, cx + 160, cy + 280], 20, 160, fill=FG, width=LINE)
    footer(d, "Twinkle Star")
    return img


def duck():
    img, d = new_page()
    cx = W // 2
    d.ellipse([cx - 520, 1550, cx + 520, 2500], outline=FG, width=LINE)  # body
    d.ellipse([cx - 260, 950, cx + 260, 1650], outline=FG, width=LINE)  # head
    d.polygon([(cx + 200, 1200), (cx + 520, 1300), (cx + 200, 1420)], outline=FG, width=LINE)  # beak
    d.ellipse([cx - 40, 1120, cx + 40, 1200], fill=FG)  # eye
    d.ellipse([cx - 360, 1750, cx + 60, 2200], outline=FG, width=LINE)  # wing
    # water
    d.arc([cx - 900, 2450, cx - 300, 2650], 200, 340, fill=FG, width=LINE)
    d.arc([cx - 200, 2500, cx + 400, 2700], 200, 340, fill=FG, width=LINE)
    d.arc([cx + 500, 2450, cx + 1000, 2650], 200, 340, fill=FG, width=LINE)
    footer(d, "Duckling")
    return img


def apple():
    img, d = new_page()
    cx, cy = W // 2, H // 2 + 60
    d.ellipse([cx - 780, cy - 720, cx + 780, cy + 820], outline=FG, width=LINE)
    d.line([cx, cy - 720, cx, cy - 1080], fill=FG, width=LINE)  # stem
    d.ellipse([cx + 40, cy - 1080, cx + 540, cy - 780], outline=FG, width=LINE)  # leaf
    d.line([cx + 40, cy - 930, cx + 540, cy - 930], fill=FG, width=LINE)
    # highlight
    d.arc([cx - 560, cy - 480, cx - 200, cy - 120], 120, 300, fill=FG, width=LINE)
    footer(d, "Yummy Apple")
    return img


PAGES = [
    ("sun", sun, "Happy Sun"),
    ("house", house, "My House"),
    ("cat", cat, "Cute Cat"),
    ("butterfly", butterfly, "Butterfly"),
    ("fish", fish, "Little Fish"),
    ("flower", flower, "Big Flower"),
    ("car", car, "My Car"),
    ("rocket", rocket, "Space Rocket"),
    ("tree", tree, "Apple Tree"),
    ("heart", heart, "Love Heart"),
    ("star", star, "Twinkle Star"),
    ("duck", duck, "Duckling"),
    ("apple", apple, "Yummy Apple"),
]


if __name__ == "__main__":
    count = int(sys.argv[1]) if len(sys.argv) > 1 else len(PAGES)
    outdir = sys.argv[2] if len(sys.argv) > 2 else "scripts/out_kids"
    pdfdir = os.path.join(outdir, "pdf")
    os.makedirs(pdfdir, exist_ok=True)
    for i in range(min(count, len(PAGES))):
        slug, fn, title = PAGES[i]
        png = os.path.join(outdir, f"kids_{i+1:02d}_{slug}.png")
        pdf = os.path.join(pdfdir, f"{slug}.pdf")
        img = fn()
        img.save(png, "PNG", optimize=True)
        img.save(pdf, "PDF", resolution=300.0)
        print(f"{i+1:02d}  {title:14s} -> {png}  |  {pdf}")
