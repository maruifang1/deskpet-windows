"""Key out green-screen dock frames and mirror the left frame for the right side."""

from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "tools" / "raw"
ASSET_DIR = ROOT / "assets"
HEAD_CROP_H = 260
CROP_HEAD = False


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


def alpha_ratio(image: Image.Image) -> float:
    alpha = image.getchannel("A")
    opaque = sum(1 for value in alpha.getdata() if value > 16)
    return opaque / (image.width * image.height)


def crop_head(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    band = alpha.crop((0, 0, image.width, HEAD_CROP_H))
    bbox = band.getbbox()
    if bbox is None:
        raise ValueError("frame has no opaque pixels in head region")
    pad = 8
    left = max(0, bbox[0] - pad)
    right = min(image.width, bbox[2] + pad)
    return image.crop((left, 0, right, HEAD_CROP_H))


def prepare(name: str, source: Path) -> None:
    frame = key_out_green(Image.open(source))
    if CROP_HEAD:
        frame = crop_head(frame)
    ratio = alpha_ratio(frame)
    if ratio < 0.01:
        raise SystemExit(f"frame {name} looks blank after keying (alpha ratio {ratio:.3f})")
    output = ASSET_DIR / f"frame.{name}.png"
    frame.save(output, "PNG")
    print(f"PREPARED={name} {frame.size} alpha={ratio:.2f}")


def main() -> None:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    left_raw = RAW_DIR / "frame.dockLeft.png"
    right_raw = RAW_DIR / "frame.dockRight.png"
    if not left_raw.exists():
        raise SystemExit("frame.dockLeft.png missing from tools/raw")
    if not right_raw.exists():
        Image.open(left_raw).transpose(Image.FLIP_LEFT_RIGHT).save(right_raw, "PNG")
        print("MIRRORED=frame.dockRight.png")
    prepare("dockLeft", left_raw)
    prepare("dockRight", right_raw)


if __name__ == "__main__":
    main()
