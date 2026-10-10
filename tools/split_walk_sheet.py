"""Split tools/raw/walk-sheet.png into six green-screen walk frames."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "tools" / "raw"
SHEET = RAW_DIR / "walk-sheet.png"
NAMES = ["walkA", "walkB", "walkC", "walkD", "walkE", "walkF"]


def find_gaps(image: Image.Image, threshold: float = 0.92, step: int = 4):
    width, height = image.size
    pixels = image.load()
    rows = (height + step - 1) // step
    gaps = []
    in_gap = False
    start = 0
    for x in range(width):
        green = 0
        for y in range(0, height, step):
            r, g, b = pixels[x, y]
            if g > r + 30 and g > b + 30 and g > 110:
                green += 1
        if green / rows > threshold:
            if not in_gap:
                start = x
                in_gap = True
        elif in_gap:
            gaps.append((start, x - 1))
            in_gap = False
    if in_gap:
        gaps.append((start, width - 1))
    return gaps


def main() -> None:
    sheet = Image.open(SHEET).convert("RGB")
    gaps = find_gaps(sheet)
    if len(gaps) != len(NAMES) + 1:
        raise SystemExit(f"expected {len(NAMES) + 1} green gaps, found {len(gaps)}")
    for index, name in enumerate(NAMES):
        left = gaps[index][1] + 1
        right = gaps[index + 1][0] - 1
        sheet.crop((left, 0, right + 1, sheet.height)).save(RAW_DIR / f"frame.{name}.png")
        print(f"SPLIT={name} x={left}-{right}")


if __name__ == "__main__":
    main()
