"""Key out green-screen raw frames and normalize them into transparent assets.

New frames are fitted to the same character layout as the original split
frames: character 540px tall, 24px top margin, horizontally centered, on a
588px-tall canvas. This keeps expression switches from visually jumping.
"""

from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "tools" / "raw"
ASSET_DIR = ROOT / "assets"
CANVAS_H = 588
CHAR_HEIGHT = 540
TOP_MARGIN = 24
MIN_CANVAS_W = 315

FRAMES = [
    "reactDizzy",
    "reactAngry",
    "reactEmbarrassed",
    "reactStretch",
    "reactSad",
    "idleLookLeft",
    "idleLookRight",
    "walkA",
    "walkB",
    "walkC",
    "walkD",
    "reactDance",
]


def key_out_green(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if g > r + 30 and g > b + 30 and g > 110:
                pixels[x, y] = (r, g, b, 0)
    alpha = rgba.getchannel("A")
    alpha = alpha.filter(ImageFilter.GaussianBlur(1.2))
    rgba.putalpha(alpha)
    return rgba


def trim_and_center(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError("frame has no opaque pixels after keying")

    pad = 4
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(image.width, right + pad)
    bottom = min(image.height, bottom + pad)
    cropped = image.crop((left, top, right, bottom))

    scale = CHAR_HEIGHT / cropped.height
    new_width = max(1, round(cropped.width * scale))
    cropped = cropped.resize((new_width, CHAR_HEIGHT), Image.LANCZOS)

    canvas_width = max(MIN_CANVAS_W, new_width + 48)
    canvas = Image.new("RGBA", (canvas_width, CANVAS_H), (0, 0, 0, 0))
    offset = ((canvas_width - new_width) // 2, TOP_MARGIN)
    canvas.alpha_composite(cropped, offset)
    return canvas


def alpha_ratio(image: Image.Image) -> float:
    alpha = image.getchannel("A")
    opaque = sum(1 for value in alpha.getdata() if value > 16)
    return opaque / (image.width * image.height)


def main() -> None:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    for mood in FRAMES:
        raw = RAW_DIR / f"frame.{mood}.png"
        if not raw.exists():
            print(f"MISSING={mood}")
            continue
        frame = trim_and_center(key_out_green(Image.open(raw)))
        ratio = alpha_ratio(frame)
        if ratio < 0.03:
            raise SystemExit(f"frame {mood} looks blank after keying (alpha ratio {ratio:.3f})")
        output = ASSET_DIR / f"frame.{mood}.png"
        frame.save(output, "PNG")
        print(f"PREPARED={mood} {frame.size} alpha={ratio:.2f}")


if __name__ == "__main__":
    main()
