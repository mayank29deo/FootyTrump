"""Generate FootyTrump favicon + app-icon variants from a single source PNG.

Usage:  python scripts/gen_icons.py
Source: branding/icon-source.png  (square, ideally >= 512x512)
Output: client/public/  (favicon.ico, favicon-16/32, apple-touch-icon, icon-192/512)
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "client", "public")
SRC = os.path.join(ROOT, "branding", "icon-source.png")

img = Image.open(SRC).convert("RGBA")
# center-crop to a square if it isn't already
w, h = img.size
if w != h:
    s = min(w, h)
    img = img.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s))

def r(size):
    return img.resize((size, size), Image.LANCZOS)

png_sizes = {
    "favicon-16x16.png": 16,
    "favicon-32x32.png": 32,
    "apple-touch-icon.png": 180,
    "icon-192.png": 192,
    "icon-512.png": 512,
}
for name, size in png_sizes.items():
    r(size).save(os.path.join(PUBLIC, name))

# multi-resolution .ico
r(256).save(os.path.join(PUBLIC, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])

print("Generated:", ", ".join(list(png_sizes) + ["favicon.ico"]))
