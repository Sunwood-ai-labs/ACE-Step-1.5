"""Background orchestration for shared Library visualizer videos."""

from __future__ import annotations

import subprocess
from concurrent.futures import Executor, ThreadPoolExecutor
from pathlib import Path
from typing import Any, Callable

from loguru import logger

from acestep.api.visualizer_renderer import VisualizerRenderError, render_visualizer
from acestep.api.visualizer_store import ASPECT_SIZES, VisualizerStore


CommandRunner = Callable[..., subprocess.CompletedProcess[str]]


class VisualizerService:
    """Queue local FFmpeg work without blocking music generation or HTTP requests."""

    def __init__(
        self,
        root_path: str,
        library_store: Any,
        *,
        command_runner: CommandRunner = subprocess.run,
        executor: Executor | None = None,
        ffmpeg_bin: str = "ffmpeg",
        timeout_seconds: int = 900,
    ) -> None:
        """Create a single-worker visualizer renderer.

        Args:
            root_path: Persistent root for video state and files.
            library_store: Shared audio catalog used to resolve Library item IDs.
            command_runner: Injectable subprocess runner for deterministic tests.
            executor: Optional renderer executor; production uses one local worker.
            ffmpeg_bin: FFmpeg executable name or path.
            timeout_seconds: Maximum time allowed for one video render.
        """

        self._library_store = library_store
        self._store = VisualizerStore(root_path)
        self._command_runner = command_runner
        self._executor = executor or ThreadPoolExecutor(
            max_workers=1,
            thread_name_prefix="forge-visualizer",
        )
        self._owns_executor = executor is None
        self._ffmpeg_bin = ffmpeg_bin
        self._timeout_seconds = timeout_seconds

    def list_for_item(self, item_id: str) -> list[dict[str, Any]]:
        """Return shared visualizer status for one Library item."""

        return self._store.list_for_item(item_id)

    def request_render(self, item_id: str, aspect: str) -> dict[str, Any]:
        """Queue a render for a Library item and return its immediate status.

        Raises:
            ValueError: If the requested aspect is unsupported.
            FileNotFoundError: If the Library item has no available audio file.
        """

        if aspect not in ASPECT_SIZES:
            raise ValueError("Unsupported visualizer aspect")
        track = self._resolve_library_track(item_id)
        if track is None:
            raise FileNotFoundError("Library audio not found")
        audio_path, title, created_at, metadata = track
        record, key, output_path, should_render = self._store.start_render(item_id, aspect)
        if should_render:
            self._executor.submit(
                self._render,
                key,
                audio_path,
                output_path,
                aspect,
                title,
                created_at,
                metadata,
            )
        return record

    def resolve_video(self, filename: str) -> Path | None:
        """Resolve a ready catalog-owned MP4 file safely."""

        return self._store.resolve_video(filename)

    def remove_for_item(self, item_id: str) -> None:
        """Remove visualizer assets when their parent Library item is deleted."""

        self._store.remove_for_item(item_id)

    def shutdown(self) -> None:
        """Stop accepting renderer work at API shutdown."""

        if self._owns_executor:
            self._executor.shutdown(wait=False, cancel_futures=True)

    def _render(
        self,
        key: str,
        audio_path: Path,
        output_path: Path,
        aspect: str,
        title: str,
        created_at: int | None,
        metadata: dict[str, Any],
    ) -> None:
        temporary_path = output_path.with_name(f".{output_path.stem}.partial.mp4")
        try:
            temporary_path.unlink(missing_ok=True)
            render_visualizer(
                audio_path,
                temporary_path,
                size=ASPECT_SIZES[aspect],
                title=title,
                created_at=created_at,
                metadata=metadata,
                command_runner=self._command_runner,
                ffmpeg_bin=self._ffmpeg_bin,
                timeout_seconds=self._timeout_seconds,
            )
            if not self._store.finish_render(key, temporary_path, output_path):
                temporary_path.unlink(missing_ok=True)
        except (OSError, subprocess.SubprocessError, VisualizerRenderError) as error:
            temporary_path.unlink(missing_ok=True)
            logger.warning("Visualizer render failed: {}", error)
            self._store.fail_render(key, str(error))

    def _resolve_library_track(
        self, item_id: str
    ) -> tuple[Path, str, int | None, dict[str, Any]] | None:
        for item in self._library_store.list_items(limit=60):
            if item.get("id") != item_id:
                continue
            result = item.get("result") if isinstance(item.get("result"), dict) else {}
            audio_path = self._library_store.resolve_audio(str(result.get("filename") or ""))
            if audio_path is None:
                return None
            title = str(result.get("prompt") or "Untitled take")
            created_at = item.get("created_at")
            metadata = result.get("metas") if isinstance(result.get("metas"), dict) else {}
            return audio_path, title, created_at if isinstance(created_at, int) else None, metadata
        return None
