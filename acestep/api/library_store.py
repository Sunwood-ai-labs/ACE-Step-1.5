"""Persistent, shared catalog for completed Forge audio generations."""

from __future__ import annotations

import json
import os
import shutil
import tempfile
import time
from pathlib import Path
from threading import Lock
from typing import Any


class LibraryStore:
    """Store completed audio and its safe reader-facing metadata on disk."""

    def __init__(self, root_path: str, max_items: int = 60) -> None:
        """Create a catalog rooted in a Compose-mounted directory.

        Args:
            root_path: Persistent directory containing the JSON catalog and audio files.
            max_items: Maximum number of recent items retained in the catalog.
        """

        self._root = Path(root_path)
        self._audio_dir = self._root / "audio"
        self._catalog_path = self._root / "library.json"
        self._max_items = max_items
        self._lock = Lock()
        self._audio_dir.mkdir(parents=True, exist_ok=True)

    def list_items(self, limit: int = 60) -> list[dict[str, Any]]:
        """Return newest persisted items without leaking local filesystem paths."""

        with self._lock:
            return self._read_items_locked()[: max(1, min(limit, self._max_items))]

    def record_success(
        self,
        *,
        job_id: str,
        result: dict[str, Any],
        prompt: str,
        lyrics: str,
        task_type: str,
        created_at: float | None = None,
    ) -> list[dict[str, Any]]:
        """Copy generated audio into the shared library and persist its catalog entries."""

        raw_paths = [str(path) for path in result.get("raw_audio_paths", []) if path]
        if not raw_paths:
            return []

        metadata = result.get("metas") if isinstance(result.get("metas"), dict) else {}
        safe_prompt = prompt or str(result.get("prompt") or metadata.get("prompt") or "")
        safe_lyrics = lyrics or str(result.get("lyrics") or metadata.get("lyrics") or "")
        created_ms = int((created_at if created_at is not None else time.time()) * 1000)
        entries: list[dict[str, Any]] = []

        with self._lock:
            items = self._read_items_locked()
            ids = {f"{job_id}:{index}" for index in range(len(raw_paths))}
            retained = [item for item in items if item.get("id") not in ids]

            for index, raw_path in enumerate(raw_paths):
                source = Path(raw_path)
                if not source.is_file():
                    continue
                extension = source.suffix.lower() or ".mp3"
                filename = f"{job_id}-{index}{extension}"
                self._copy_audio_locked(source, self._audio_dir / filename)
                entries.append(
                    self._build_item(
                        item_id=f"{job_id}:{index}",
                        filename=filename,
                        created_at=created_ms,
                        task_type=task_type,
                        prompt=safe_prompt,
                        lyrics=safe_lyrics,
                        metadata=metadata,
                        result=result,
                    )
                )

            self._write_items_locked(entries + retained)
        return entries

    def remove(self, item_id: str) -> bool:
        """Delete one catalog item and only its catalog-managed audio file."""

        with self._lock:
            items = self._read_items_locked()
            removed = next((item for item in items if item.get("id") == item_id), None)
            if removed is None:
                return False
            self._write_items_locked([item for item in items if item.get("id") != item_id])
            filename = str(removed.get("result", {}).get("filename") or "")
            audio_path = self.resolve_audio(filename)
            if audio_path is not None:
                audio_path.unlink(missing_ok=True)
            return True

    def resolve_audio(self, filename: str) -> Path | None:
        """Resolve one catalog-owned audio filename without allowing path traversal."""

        if not filename or Path(filename).name != filename:
            return None
        candidate = (self._audio_dir / filename).resolve(strict=False)
        try:
            candidate.relative_to(self._audio_dir.resolve())
        except ValueError:
            return None
        return candidate if candidate.is_file() else None

    def _read_items_locked(self) -> list[dict[str, Any]]:
        try:
            payload = json.loads(self._catalog_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return []
        raw_items = payload.get("items", []) if isinstance(payload, dict) else []
        items = [item for item in raw_items if isinstance(item, dict) and isinstance(item.get("id"), str)]
        return sorted(items, key=lambda item: int(item.get("created_at", 0)), reverse=True)

    def _write_items_locked(self, items: list[dict[str, Any]]) -> None:
        self._root.mkdir(parents=True, exist_ok=True)
        payload = {"schema_version": 1, "items": items[: self._max_items]}
        fd, temporary_path = tempfile.mkstemp(prefix=".library-", suffix=".json", dir=self._root)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as file_obj:
                json.dump(payload, file_obj, ensure_ascii=False, indent=2)
                file_obj.flush()
                os.fsync(file_obj.fileno())
            os.replace(temporary_path, self._catalog_path)
        except Exception:
            Path(temporary_path).unlink(missing_ok=True)
            raise

    @staticmethod
    def _copy_audio_locked(source: Path, destination: Path) -> None:
        destination.parent.mkdir(parents=True, exist_ok=True)
        fd, temporary_path = tempfile.mkstemp(prefix=".audio-", suffix=destination.suffix, dir=destination.parent)
        os.close(fd)
        try:
            shutil.copyfile(source, temporary_path)
            os.replace(temporary_path, destination)
        except Exception:
            Path(temporary_path).unlink(missing_ok=True)
            raise

    @staticmethod
    def _build_item(
        *,
        item_id: str,
        filename: str,
        created_at: int,
        task_type: str,
        prompt: str,
        lyrics: str,
        metadata: dict[str, Any],
        result: dict[str, Any],
    ) -> dict[str, Any]:
        return {
            "id": item_id,
            "created_at": created_at,
            "task_type": task_type or "text2music",
            "state": "ready",
            "result": {
                "filename": filename,
                "file": f"/v1/library/audio/{filename}",
                "prompt": prompt,
                "lyrics": lyrics,
                "metas": {
                    key: metadata.get(key)
                    for key in ("bpm", "duration", "genres", "keyscale", "timesignature")
                    if metadata.get(key) not in (None, "")
                },
                "seed_value": str(result.get("seed_value") or ""),
                "dit_model": str(result.get("dit_model") or ""),
            },
        }
