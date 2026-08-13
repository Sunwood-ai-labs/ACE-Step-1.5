"""Editorial artwork primitives for ACE-Step Forge social visualizers."""

from __future__ import annotations

import hashlib
import re
from datetime import datetime
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFilter, ImageFont


_SANS = (
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
    "C:/Windows/Fonts/YuGothM.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
)
_DISPLAY = (
    "/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc",
    "/usr/share/fonts/truetype/noto/NotoSerifCJK-Regular.ttc",
    "C:/Windows/Fonts/YuMincho.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
)
_PAPER, _INK, _CORAL, _OCHRE, _TEAL = "#F3EFE7", "#122223", "#E85D3A", "#C89643", "#3C7D79"
def visualizer_signal_layout(size: tuple[int, int]) -> tuple[int, int, int, int]:
    """Return the open signal rail reserved for the reactive trace."""
    width, height = size
    margin = round(width * (0.075 if height > width else 0.06))
    return margin, round(height * (0.445 if height > width else 0.55)), width - margin * 2, round(height * (0.24 if height > width else 0.26))
def visualizer_wave_layout(size: tuple[int, int]) -> tuple[int, int, int, int]:
    """Return the live trace rectangle layered over the open signal rail."""
    x, y, width, height = visualizer_signal_layout(size)
    inset = round(width * 0.018)
    return x + inset, y + round(height * 0.18), width - inset * 2, round(height * 0.64)


def create_social_backdrop(
    output_path: Path,
    *,
    size: tuple[int, int],
    title: str,
    created_at: int | None,
    metadata: dict[str, Any],
) -> None:
    """Create a paper-and-ink poster with an open, full-width audio rail."""
    width, height = size
    portrait = height > width
    canvas = Image.new("RGBA", size, _PAPER)
    _paint_atmosphere(canvas, title)
    draw = ImageDraw.Draw(canvas, "RGBA")
    margin = round(width * (0.075 if portrait else 0.06))
    label = _font(_SANS, max(18, round(width * (0.021 if portrait else 0.014))))
    body = _font(_SANS, max(22, round(width * (0.027 if portrait else 0.018))))
    display = _display_title(title)
    base = max(54, round(width * (0.112 if portrait else 0.065)))
    title_font = _fit_font(draw, display, _DISPLAY, base, width - margin * 2)
    _draw_header(draw, width, margin, label)
    _draw_title(draw, display, margin, round(height * 0.155), title_font, label)
    _draw_signal_frame(draw, size, label)
    _draw_footer(draw, width, height, margin, body, label, created_at, metadata)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(output_path, "PNG", optimize=True)


def _paint_atmosphere(canvas: Image.Image, title: str) -> None:
    """Add localized color, print-like grain, and a quiet registration grid."""
    width, height = canvas.size
    layer = Image.new("RGBA", canvas.size)
    draw = ImageDraw.Draw(layer)
    glows = (
        ((-width // 4, -height // 8, width * 3 // 5, height * 3 // 5), (60, 125, 115, 78)),
        ((width * 2 // 5, height // 3, width + width // 3, height + height // 8), (232, 93, 58, 82)),
        ((width // 5, height * 2 // 5, width * 4 // 5, height * 5 // 6), (200, 150, 65, 35)),
    )
    for bounds, color in glows:
        draw.ellipse(bounds, fill=color)
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(radius=max(34, width // 13))))
    digest = hashlib.sha256(title.encode("utf-8")).digest()
    grid = ImageDraw.Draw(canvas, "RGBA")
    for index in range(9):
        y = round(height * (0.09 + index * 0.1))
        grid.line((0, y, width, y), fill=(18, 34, 35, 12), width=1)
    for index in range(7):
        x = round(width * (0.08 + index * 0.14))
        grid.line((x, 0, x, height), fill=(18, 34, 35, 8), width=1)
    for index in range(220):
        x = (digest[index % len(digest)] * (index + 13)) % width
        y = (digest[(index + 9) % len(digest)] * (index + 31)) % height
        grid.point((x, y), fill=(18, 34, 35, 24))


def _draw_header(draw: ImageDraw.ImageDraw, width: int, margin: int, font: ImageFont.ImageFont) -> None:
    """Set a compact brand line and edition marker at the poster edge."""
    draw.text((margin, margin), "ACE–STEP FORGE  /  AUDIO STUDY", fill=_INK, font=font)
    mark = "06  /  LOCAL"
    bounds = draw.textbbox((0, 0), mark, font=font)
    draw.text((width - margin - (bounds[2] - bounds[0]), margin), mark, fill=_CORAL, font=font)


def _draw_title(draw: ImageDraw.ImageDraw, title: str, x: int, y: int, font: ImageFont.ImageFont, label: ImageFont.ImageFont) -> None:
    """Make the prompt the first focal point without awkward Japanese wrapping."""
    draw.text((x, y), title, fill=_INK, font=font)
    bottom = draw.textbbox((x, y), title, font=font)[3]
    rule_y = bottom + round(font.size * 0.26)
    draw.line((x, rule_y, x + round(font.size * 2.8), rule_y), fill=_CORAL, width=max(3, round(font.size * 0.035)))
    draw.text((x, rule_y + round(font.size * 0.22)), "AUDIO CONTOUR  /  LIBRARY CUT", fill=_TEAL, font=label)


def _draw_signal_frame(draw: ImageDraw.ImageDraw, size: tuple[int, int], font: ImageFont.ImageFont) -> None:
    """Draw a typographic rail, ticks, and orbit detail around the live waveform."""
    x, y, width, height = visualizer_signal_layout(size)
    edge = max(2, round(size[0] * 0.0022))
    draw.line((x, y, x + width, y), fill=(18, 34, 35, 125), width=edge)
    draw.line((x, y + height, x + width, y + height), fill=(18, 34, 35, 100), width=edge)
    draw.line((x, y, x, y + height), fill=_CORAL, width=max(4, edge * 2))
    for index in range(13):
        tick_x = x + round(width * index / 12)
        draw.line((tick_x, y - edge * 4, tick_x, y + edge * 3), fill=(18, 34, 35, 90), width=edge)
    orbit_x, orbit_y = round(x + width * 0.84), round(y + height * 0.25)
    for radius in (round(width * 0.19), round(width * 0.145), round(width * 0.1)):
        draw.arc((orbit_x - radius, orbit_y - radius, orbit_x + radius, orbit_y + radius), 205, 342, fill=(60, 125, 115, 120), width=edge)
    draw.text((x, y - font.size - round(font.size * 0.45)), "LIVE TRACE", fill=_INK, font=font)
    right = "SIGNAL / 01"
    bounds = draw.textbbox((0, 0), right, font=font)
    draw.text((x + width - (bounds[2] - bounds[0]), y - font.size - round(font.size * 0.45)), right, fill=_CORAL, font=font)
    caption_y = y + height - font.size - 6 if size[1] <= size[0] else y + height + round(font.size * 0.34)
    draw.text((x + round(width * 0.018), caption_y), "BASS / MID / AIR", fill=(18, 34, 35, 170), font=font)


def _draw_footer(draw: ImageDraw.ImageDraw, width: int, height: int, margin: int, body: ImageFont.ImageFont, label: ImageFont.ImageFont, created_at: int | None, metadata: dict[str, Any]) -> None:
    """Keep musical facts and export status visible as editorial metadata."""
    line_y = height - margin - round(body.size * (3 if height > width else 2.4))
    draw.line((margin, line_y, width - margin, line_y), fill=(18, 34, 35, 130), width=2)
    draw.text((margin, line_y + label.size), _metadata_line(metadata), fill=_INK, font=body)
    stamp = _date_label(created_at)
    bounds = draw.textbbox((0, 0), stamp, font=label)
    draw.text((width - margin - (bounds[2] - bounds[0]), line_y + label.size), stamp, fill=_CORAL, font=label)
    draw.text((margin, height - margin - label.size), f"EXPORT READY  ·  AUDIO REACTIVE  ·  {width}×{height}", fill=(18, 34, 35, 175), font=label)


def _display_title(title: str) -> str:
    """Reduce a generation prompt to a short, intentional social title."""
    text = " ".join(title.split())
    for prefix in ("短い生成確認用の", "実録デモ用の", "ボーカルなしの"):
        text = text.removeprefix(prefix)
    head = re.split(r"[。.:：、,]", text, maxsplit=1)[0].strip()
    if "和風インスト" in head:
        return "和風インスト"
    if "和風ロック" in head:
        return "和風ロック"
    if "japanese rock" in head.lower():
        return "Japanese rock"
    if re.search(r"[\u3040-\u30ff\u4e00-\u9fff]", head):
        compact = re.sub(r"[\s・]+", "", head)
        return compact[:10] + ("…" if len(compact) > 10 else "")
    return head[:24] + ("…" if len(head) > 24 else "") or "Untitled take"


def _metadata_line(metadata: dict[str, Any]) -> str:
    """Format available musical facts without displaying a lone time signature."""
    def usable(value: Any) -> bool:
        return bool(value) and str(value).lower() not in {"n/a", "unknown", "-"}

    parts: list[str] = []
    if usable(metadata.get("bpm")):
        parts.append(f"{metadata['bpm']} BPM")
    if usable(metadata.get("keyscale")):
        parts.append(str(metadata["keyscale"]).upper())
    signature = str(metadata.get("timesignature") or "")
    if parts and signature and "/" not in signature:
        signature = f"{signature}/4"
    if parts and signature:
        parts.append(signature)
    return "  ·  ".join(parts) or "LOCAL ORIGINAL"


def _date_label(created_at: int | None) -> str:
    """Format an optional Library timestamp for a compact edition stamp."""
    return datetime.fromtimestamp(created_at / 1000).strftime("%Y.%m.%d") if created_at else "FORGE EDITION"


def _fit_font(draw: ImageDraw.ImageDraw, text: str, candidates: tuple[str, ...], base_size: int, max_width: int) -> ImageFont.ImageFont:
    """Fit a single-line headline to the video-safe readable width."""
    for size in range(base_size, 40, -4):
        font = _font(candidates, size)
        if draw.textlength(text, font=font) <= max_width:
            return font
    return _font(candidates, 40)


def _font(candidates: tuple[str, ...], size: int) -> ImageFont.ImageFont:
    """Load a Japanese-capable font with a deterministic local fallback."""
    for candidate in candidates:
        if Path(candidate).is_file():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()
