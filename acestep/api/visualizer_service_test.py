"""Unit tests for persistent local visualizer rendering orchestration."""

from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from typing import Any, Callable

from acestep.api.library_store import LibraryStore
from acestep.api.visualizer_service import VisualizerService
from acestep.api.visualizer_store import VisualizerStore


class _InlineExecutor:
    """Run submitted work immediately to make render state deterministic in tests."""

    def submit(self, function: Callable[..., None], *args: Any) -> None:
        """Execute a submitted render without starting a background thread."""

        function(*args)


def _write_video(command: list[str], **_: Any) -> subprocess.CompletedProcess[str]:
    """Act like a successful FFmpeg process and write its requested output file."""

    Path(command[-1]).write_bytes(b"fake-mp4")
    return subprocess.CompletedProcess(command, 0, "", "")


class VisualizerServiceTests(unittest.TestCase):
    """Verify a completed take gains a safely owned visualizer video."""

    def test_renders_lists_and_deletes_a_visualizer(self) -> None:
        """A completed Library item can gain an MP4 and removes it with the item."""

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "take.mp3"
            source.write_bytes(b"test-audio")
            library = LibraryStore(str(root / "library"))
            item = library.record_success(
                job_id="job-1",
                result={"raw_audio_paths": [str(source)], "metas": {"duration": 10}},
                prompt="koto rock",
                lyrics="",
                task_type="text2music",
            )[0]
            service = VisualizerService(
                str(root / "visualizers"),
                library,
                command_runner=_write_video,
                executor=_InlineExecutor(),
            )

            queued = service.request_render(item["id"], "landscape")
            self.assertEqual("rendering", queued["state"])
            rendered = service.list_for_item(item["id"])[0]
            self.assertEqual("ready", rendered["state"])
            filename = rendered["file"].rsplit("/", maxsplit=1)[-1]
            self.assertIn("social-v7-landscape.mp4", filename)
            self.assertEqual(b"fake-mp4", service.resolve_video(filename).read_bytes())

            service.remove_for_item(item["id"])
            self.assertEqual([], service.list_for_item(item["id"]))
            self.assertIsNone(service.resolve_video(filename))

    def test_marks_a_legacy_video_for_social_refresh(self) -> None:
        """A bare waveform record becomes actionable instead of silently remaining current."""

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "visualizers"
            video_dir = root / "video"
            video_dir.mkdir(parents=True)
            (video_dir / "legacy-landscape.mp4").write_bytes(b"old-waveform")
            (root / "visualizers.json").write_text(
                json.dumps(
                    {
                        "items": [
                            {
                                "item_id": "job-1:0",
                                "aspect": "landscape",
                                "state": "ready",
                                "filename": "legacy-landscape.mp4",
                                "updated_at": 1,
                                "error": None,
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )
            asset = VisualizerStore(str(root)).list_for_item("job-1:0")[0]
            self.assertEqual("failed", asset["state"])
            self.assertIn("refreshed social video", asset["error"])


if __name__ == "__main__":
    unittest.main()
