"""Downloads the selected Unsplash photos and writes web-optimized crops into
frontend/public/images/. Unsplash License: free for commercial use, no
attribution required (credited anyway in docs/frontend/ASSETS.md).

Usage (needs Pillow):  python scripts/build_image_assets.py frontend/public/images
"""

import io
import sys
import urllib.request

from PIL import Image

OUT = sys.argv[1]

# (unsplash id, folder/name, target size (w, h), vertical focus 0=top .. 1=bottom)
ASSETS = [
    # Portrait model photography, 3:4
    ("1515886657613-9f3515b0c78f", "models/woman-yellow.jpg", (900, 1200), 0.3),
    ("1539109136881-3be0616acf4b", "models/woman-milan.jpg", (900, 1200), 0.4),
    ("1485968579580-b6d095142e6e", "models/woman-street.jpg", (900, 1200), 0.3),
    ("1581044777550-4cfa60707c03", "models/woman-pink.jpg", (900, 1200), 0.3),
    ("1509631179647-0177331693ae", "models/woman-teal.jpg", (900, 1200), 0.4),
    ("1617137968427-85924c800a22", "models/man-suit.jpg", (900, 1200), 0.35),
    ("1520975954732-35dd22299614", "models/man-leather.jpg", (900, 1200), 0.3),
    ("1531427186611-ecfd6d936c79", "models/man-shirt.jpg", (900, 1200), 0.2),
    ("1607345366928-199ea26cfe3e", "models/man-flannel.jpg", (900, 1200), 0.3),
    ("1519457431-44ccd64a579b", "models/girl-blue-wall.jpg", (900, 1200), 0.4),
    ("1518831959646-742c3a14ebf7", "models/girl-garden.jpg", (900, 1200), 0.4),
    ("1596870230751-ebdfce98ec42", "models/boy-skate.jpg", (900, 1200), 0.3),
    ("1519238263530-99bdd11df2ea", "models/boy-bowtie.jpg", (900, 1200), 0.2),
    # Wide editorial, 16:9
    ("1445205170230-053b83016050", "editorial/store-rack.jpg", (1800, 1013), 0.5),
    ("1483985988355-763728e1935b", "editorial/shopping.jpg", (1800, 1013), 0.35),
    ("1441986300917-64674bd600d8", "editorial/boutique.jpg", (1800, 1013), 0.5),
    ("1558769132-cb1aea458c5e", "editorial/rail-neutral.jpg", (1800, 1013), 0.5),
    # Square product/flat-lay
    ("1516762689617-e1cffcef479d", "products/flatlay-denim.jpg", (900, 900), 0.5),
    ("1544441893-675973e31985", "products/flatlay-dark.jpg", (900, 900), 0.5),
    ("1434389677669-e08b4cac3105", "products/knit-hanger.jpg", (900, 900), 0.4),
    ("1622290291468-a28f7a7dc6a8", "products/kids-flatlay.jpg", (900, 900), 0.5),
    ("1490481651871-ab68de25d43d", "products/rail-white.jpg", (900, 900), 0.4),
]


def crop_to(image: Image.Image, size: tuple[int, int], focus_y: float) -> Image.Image:
    target_w, target_h = size
    ratio = target_w / target_h
    w, h = image.size
    if w / h > ratio:  # too wide: crop the sides, centered
        new_w = int(h * ratio)
        left = (w - new_w) // 2
        box = (left, 0, left + new_w, h)
    else:  # too tall: crop top/bottom around the focus line
        new_h = int(w / ratio)
        top = int((h - new_h) * focus_y)
        box = (0, top, w, top + new_h)
    return image.crop(box).resize(size, Image.LANCZOS)


for photo_id, dest, size, focus in ASSETS:
    url = f"https://images.unsplash.com/photo-{photo_id}?w={max(size) * 2}&q=90&fm=jpg"
    with urllib.request.urlopen(url, timeout=60) as response:
        image = Image.open(io.BytesIO(response.read())).convert("RGB")
    crop_to(image, size, focus).save(
        f"{OUT}/{dest}", "JPEG", quality=78, optimize=True, progressive=True
    )
    print(dest)
