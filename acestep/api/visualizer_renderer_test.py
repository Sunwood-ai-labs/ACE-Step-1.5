"""Tests for the social-video FFmpeg renderer contract."""

from __future__ import annotations

import subprocess
import tempfile
import unittest
from pathlib import Path

from acestep.api.visualizer_renderer import build_visualizer_command, render_visualizer


def _write_video(command: list[str], **_: object) -> subprocess.CompletedProcess[str]:
    """Write a fixture MP4 where the injected FFmpeg command expects it."""

    Path(command[-1]).write_bytes(b"social-video")
    return subprocess.CompletedProcess(command, 0, "", "")


class VisualizerRendererTests(unittest.TestCase):
    """Verify polished artwork and the waveform are assembled as one video."""

    def test_builds_a_waveform_overlay_command(self) -> None:
        """The command loops the artwork and overlays audio-reactive motion on it."""

        command = build_visualizer_command(
            Path("take.mp3"),
            Path("take.mp4"),
            size=(1080, 1920),
            backdrop_path=Path("frame.png"),
            duration_seconds=10,
            ffmpeg_bin="ffmpeg",
        )
        filter_graph = command[command.index("-filter_complex") + 1]
        self.assertIn("-loop", command)
        self.assertIn("showwaves", filter_graph)
        self.assertIn("draw=full", filter_graph)
        self.assertIn("overlay=98:937", filter_graph)
        self.assertIn("frame.png", command)

    def test_renders_japanese_title_and_cleans_temporary_artwork(self) -> None:
        """A social frame supports CJK titles and leaves no transient PNG behind."""

        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "take.mp4"
            render_visualizer(
                Path(directory) / "take.mp3",
                output,
                size=(1080, 1920),
                title="和風ロック・夜の祭り",
                created_at=0,
                metadata={"bpm": 132, "genres": "Japanese rock", "duration": 10},
                command_runner=_write_video,
            )
            self.assertEqual(b"social-video", output.read_bytes())
            self.assertEqual([], list(Path(directory).glob("*.frame.png")))


if __name__ == "__main__":
    unittest.main()
