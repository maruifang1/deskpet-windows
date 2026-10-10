"""Generate the 8 non-walk pet expression frames with the Qwen Image edit tool.

Each frame starts from the same green-screen morning raw so the character,
clothing, and palette stay consistent. Outputs land in tools/raw and are
keyed out by prepare_frames.py afterwards. The six walking frames are split
from tools/raw/walk-sheet.png by split_walk_sheet.py instead.
"""

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "tools" / "raw"
BASE = Path(r"D:\Allproject\python\desktop-pet-me\ios-deskpet\tools\raw\frame.morning.png")
IMAGE_TOOL = Path(r"C:\Users\Lenovo\.codex\skills\image-generation\scripts\image_tool.py")

COMMON = "背景保持纯色亮绿色绿幕，用于抠图；全身只有哑光黑和冷银两色，无多余亮色；人物轮廓完整，正面全身居中。"
NEGATIVE = "多余手指、变形、文字、水印、亮色点缀、渐变背景、复杂背景、衣服变色、动作崩坏"

FRAMES = [
    (
        "reactDizzy",
        "以图1的人物为原型，保持人物形象、服装、配色与画风完全一致；改成晕眩表情：眼睛画成小漩涡，微微歪头，一只手扶住头，身体轻微摇晃站立；" + COMMON,
        3011,
    ),
    (
        "reactAngry",
        "以图1的人物为原型，保持人物形象、服装、配色与画风完全一致；改成生气表情：眉头紧锁，嘴巴嘟起或撇嘴，双臂交叉抱在胸前，情绪明显；" + COMMON,
        3012,
    ),
    (
        "reactEmbarrassed",
        "以图1的人物为原型，保持人物形象、服装、配色与画风完全一致；改成害羞表情：一只手半掩着脸，眼神躲闪看向侧下方，微微低头，没有脸红；" + COMMON,
        3013,
    ),
    (
        "reactStretch",
        "以图1的人物为原型，保持人物形象、服装、配色与画风完全一致；改成伸懒腰打哈欠：双臂向上举起，身体微微后仰，双眼半闭，嘴巴张开打哈欠；" + COMMON,
        3015,
    ),
    (
        "reactSad",
        "以图1的人物为原型，保持人物形象、服装、配色与画风完全一致；改成委屈表情：嘴角向下瘪起，眼眶含泪，微微低头，双手垂在身前；" + COMMON,
        3016,
    ),
    (
        "idleLookLeft",
        "以图1的人物为原型，保持人物形象、服装、配色与画风完全一致；改成向左张望：头部微微向左转，眼睛看向左前方，表情平淡好奇；" + COMMON,
        3017,
    ),
    (
        "idleLookRight",
        "以图1的人物为原型，保持人物形象、服装、配色与画风完全一致；改成向右张望：头部微微向右转，眼睛看向右前方，表情平淡好奇；" + COMMON,
        3018,
    ),
    (
        "reactDance",
        "以图1的人物为原型，保持人物形象、服装、配色与画风完全一致；改成跳舞动作：双脚离地跳起，双手向上张开，表情开心放松；" + COMMON,
        3021,
    ),
]


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for mood, prompt, seed in FRAMES:
        output = OUT_DIR / f"frame.{mood}.png"
        env = os.environ.copy()
        env["HTTPS_PROXY"] = ""
        env["HTTP_PROXY"] = ""
        command = [
            sys.executable,
            str(IMAGE_TOOL),
            "edit",
            "--image",
            str(BASE),
            "--prompt",
            prompt,
            "--style",
            "anime",
            "--seed",
            str(seed),
            "--negative-prompt",
            NEGATIVE,
            "--output",
            str(output),
        ]
        print(f"GENERATING={mood}")
        result = subprocess.run(command, env=env, check=True)
        if result.returncode != 0:
            raise SystemExit(f"generation failed for {mood}")
        print(f"GENERATED={mood} -> {output}")


if __name__ == "__main__":
    main()
