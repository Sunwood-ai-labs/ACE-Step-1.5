"""FFmpeg rendering for expressive, audio-reactive Forge social videos."""

from __future__ import annotations

import subprocess
from pathlib import Path
from typing import Any, Callable

from acestep.api.visualizer_artwork import (
    create_social_backdrop,
    visualizer_wave_layout,
)


CommandRunner = Callable[..., subprocess.CompletedProcess[str]]


class VisualizerRenderError(RuntimeError):
    """Raised when FFmpeg cannot produce a usable visualizer MP4."""


def render_visualizer(
    audio_path: Path,
    output_path: Path,
    *,
    size: tuple[int, int],
    title: str,
    created_at: int | None,
    metadata: dict[str, Any],
    command_runner: CommandRunner = subprocess.run,
    ffmpeg_bin: str = "ffmpeg",
    timeout_seconds: int = 900,
) -> None:
    """Render one Library track as a paper-and-ink live trace with H.264/AAC audio."""

    backdrop_path = output_path.with_name(f".{output_path.stem}.frame.png")
    try:
        create_social_backdrop(backdrop_path, size=size, title=title, created_at=created_at, metadata=metadata)
        duration_seconds = _audio_duration(audio_path, metadata)
        completed = command_runner(
            build_visualizer_command(audio_path, output_path, size=size, backdrop_path=backdrop_path, duration_seconds=duration_seconds, ffmpeg_bin=ffmpeg_bin),
            capture_output=True,
            check=False,
            text=True,
            timeout=timeout_seconds,
        )
    except (OSError, UnicodeError) as error:
        raise VisualizerRenderError(f"Could not prepare the social video frame: {error}") from error
    finally:
        backdrop_path.unlink(missing_ok=True)
    if completed.returncode != 0:
        details = str(getattr(completed, "stderr", "")).replace("\n", " ").strip()
        raise VisualizerRenderError(details[:240] or "FFmpeg could not render the visualizer")
    if not output_path.is_file() or output_path.stat().st_size == 0:
        raise VisualizerRenderError("FFmpeg finished without producing a video file")


def build_visualizer_command(
    audio_path: Path,
    output_path: Path,
    *,
    size: tuple[int, int],
    backdrop_path: Path,
    duration_seconds: float,
    ffmpeg_bin: str,
) -> list[str]:
    """Build FFmpeg overlays for a warm signal ribbon and a dark fine trace."""

    width, height = size
    wave_x, wave_y, wave_width, wave_height = visualizer_wave_layout(size)
    filter_graph = (
        f"[1:v]scale={width}:{height},format=rgba[canvas];"
        "[0:a]aformat=channel_layouts=mono,asplit=2[trace_audio][pulse_audio];"
        f"[pulse_audio]showwaves=s={wave_width}x{wave_height}:mode=cline:colors=0xE85D3A:rate=30:scale=cbrt:draw=full,format=rgba,colorkey=0x000000:0.01:0.0,colorchannelmixer=aa=0.68,split=2[pulse_glow][pulse];"
        "[pulse_glow]gblur=sigma=8:steps=1,colorchannelmixer=aa=0.22[glow];"
        f"[trace_audio]showwaves=s={wave_width}x{wave_height}:mode=line:colors=0x122223:rate=30:scale=log:draw=full,format=rgba,colorkey=0x000000:0.01:0.0,colorchannelmixer=aa=0.92[trace];"
        f"[canvas][glow]overlay={wave_x}:{wave_y}:format=auto[layer0];"
        f"[layer0][pulse]overlay={wave_x}:{wave_y}:format=auto[layer1];"
        f"[layer1][trace]overlay={wave_x}:{wave_y}:format=auto,format=yuv420p[video]"
    )
    return [
        ffmpeg_bin, "-y", "-hide_banner", "-loglevel", "error", "-i", str(audio_path), "-loop", "1", "-framerate", "30", "-i", str(backdrop_path),
        "-filter_complex_threads", "2", "-filter_complex", filter_graph, "-map", "[video]", "-map", "0:a:0", "-t", f"{duration_seconds:.3f}", "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-threads", "4", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(output_path),
    ]


def _audio_duration(audio_path: Path, metadata: dict[str, Any]) -> float:
    """Return a bounded duration so a looped artwork cannot render indefinitely."""

    try:
        duration = float(metadata.get("duration") or 0)
    except (TypeError, ValueError):
        duration = 0
    if duration > 0:
        return duration
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nokey=1:noprint_wrappers=1", str(audio_path)],
        capture_output=True,
        check=False,
        text=True,
        timeout=15,
    )
    try:
        duration = float(probe.stdout.strip()) if probe.returncode == 0 else 0
    except ValueError:
        duration = 0
    if duration > 0:
        return duration
    raise VisualizerRenderError("Could not determine the source audio duration")
