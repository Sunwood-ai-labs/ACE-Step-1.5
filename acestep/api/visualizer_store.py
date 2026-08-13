"""Persistent metadata and safe file ownership for Forge visualizer videos."""

from __future__ import annotations

import hashlib
import json
import os
import tempfile
import time
from pathlib import Path
from threading import Lock
from typing import Any

ASPECT_SIZES = {"landscape": (1920, 1080), "portrait": (1080, 1920)}

class VisualizerStore:
    """Persist visualizer render state alongside catalog-owned MP4 outputs."""

    def __init__(self, root_path: str) -> None:
        """Create a store rooted in the persistent Forge Library directory."""
        self._root = Path(root_path)
        self._video_dir = self._root / "video"
        self._catalog_path = self._root / "visualizers.json"
        self._lock = Lock()
        self._video_dir.mkdir(parents=True, exist_ok=True)
        self._records = self._read_records_locked()
        self._recover_interrupted_records_locked()

    def list_for_item(self, item_id: str) -> list[dict[str, Any]]:
        """Return safe visualizer state for one shared Library item."""
        with self._lock:
            if self._mark_missing_outputs_failed_locked(item_id):
                self._write_records_locked()
            return [
                self._public_record(record)
                for record in self._records.values()
                if record.get("item_id") == item_id
            ]

    def start_render(self, item_id: str, aspect: str) -> tuple[dict[str, Any], str, Path, bool]:
        """Create or reuse a render record and return its output target.

        Raises:
            ValueError: If the aspect is unsupported.
        """
        if aspect not in ASPECT_SIZES:
            raise ValueError("Unsupported visualizer aspect")
        key = self._record_key(item_id, aspect)
        output_path = self._video_dir / self._video_filename(item_id, aspect)
        with self._lock:
            record = self._records.get(key)
            if record and record.get("state") == "rendering":
                return self._public_record(record), key, output_path, False
            if record and record.get("state") == "ready" and output_path.is_file():
                return self._public_record(record), key, output_path, False
            record = {
                "item_id": item_id,
                "aspect": aspect,
                "state": "rendering",
                "filename": output_path.name,
                "updated_at": self._now_ms(),
                "error": None,
            }
            self._records[key] = record
            self._write_records_locked()
            return self._public_record(record), key, output_path, True

    def finish_render(self, key: str, temporary_path: Path, output_path: Path) -> bool:
        """Atomically publish a successful render when its item still exists."""
        with self._lock:
            if key not in self._records:
                return False
            os.replace(temporary_path, output_path)
            self._set_state_locked(key, "ready", None)
            return True

    def fail_render(self, key: str, message: str) -> None:
        """Persist a render failure unless the parent Library item was deleted."""
        with self._lock:
            if key in self._records:
                self._set_state_locked(key, "failed", message)

    def resolve_video(self, filename: str) -> Path | None:
        """Resolve a ready video file while rejecting path traversal and stale files."""
        if not filename or Path(filename).name != filename:
            return None
        with self._lock:
            known = any(
                record.get("state") == "ready" and record.get("filename") == filename
                for record in self._records.values()
            )
        candidate = (self._video_dir / filename).resolve(strict=False)
        try:
            candidate.relative_to(self._video_dir.resolve())
        except ValueError:
            return None
        return candidate if known and candidate.is_file() else None

    def remove_for_item(self, item_id: str) -> None:
        """Remove all state and video files belonging to one deleted Library item."""
        with self._lock:
            keys = [key for key, record in self._records.items() if record.get("item_id") == item_id]
            records = [self._records.pop(key) for key in keys]
            if records:
                self._write_records_locked()
        for record in records:
            (self._video_dir / str(record.get("filename") or "")).unlink(missing_ok=True)

    def _set_state_locked(self, key: str, state: str, error: str | None) -> None:
        record = self._records.get(key)
        if record is None:
            return
        record["state"] = state
        record["error"] = error
        record["updated_at"] = self._now_ms()
        self._write_records_locked()

    def _mark_missing_outputs_failed_locked(self, item_id: str) -> bool:
        changed = False
        for record in self._records.values():
            if record.get("item_id") != item_id or record.get("state") != "ready":
                continue
            filename = str(record.get("filename") or "")
            current_filename = self._video_filename(
                str(record.get("item_id") or ""), str(record.get("aspect") or "")
            )
            if filename == current_filename and (self._video_dir / filename).is_file():
                continue
            record["state"] = "failed"
            record["error"] = "A refreshed social video is available. Render it again."
            record["updated_at"] = self._now_ms()
            changed = True
        return changed

    def _recover_interrupted_records_locked(self) -> None:
        interrupted = [record for record in self._records.values() if record.get("state") == "rendering"]
        if not interrupted:
            return
        for record in interrupted:
            record["state"] = "failed"
            record["error"] = "Rendering was interrupted. Render the video again."
            record["updated_at"] = self._now_ms()
        self._write_records_locked()

    def _read_records_locked(self) -> dict[str, dict[str, Any]]:
        try:
            payload = json.loads(self._catalog_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return {}
        raw_records = payload.get("items", []) if isinstance(payload, dict) else []
        records: dict[str, dict[str, Any]] = {}
        for record in raw_records:
            item_id = record.get("item_id") if isinstance(record, dict) else None
            aspect = record.get("aspect") if isinstance(record, dict) else None
            if isinstance(item_id, str) and aspect in ASPECT_SIZES:
                records[self._record_key(item_id, aspect)] = record
        return records

    def _write_records_locked(self) -> None:
        self._root.mkdir(parents=True, exist_ok=True)
        descriptor, temporary_name = tempfile.mkstemp(
            prefix=".visualizers-",
            suffix=".json",
            dir=self._root,
        )
        try:
            with os.fdopen(descriptor, "w", encoding="utf-8") as file_obj:
                json.dump({"schema_version": 1, "items": list(self._records.values())}, file_obj, indent=2)
                file_obj.flush()
                os.fsync(file_obj.fileno())
            os.replace(temporary_name, self._catalog_path)
        except (OSError, TypeError):
            Path(temporary_name).unlink(missing_ok=True)
            raise

    @staticmethod
    def _record_key(item_id: str, aspect: str) -> str:
        return f"{item_id}|{aspect}"

    @staticmethod
    def _video_filename(item_id: str, aspect: str) -> str:
        digest = hashlib.sha256(f"{item_id}|{aspect}".encode("utf-8")).hexdigest()[:20]
        return f"{digest}-social-v7-{aspect}.mp4"

    @staticmethod
    def _now_ms() -> int:
        return int(time.time() * 1000)

    @staticmethod
    def _public_record(record: dict[str, Any]) -> dict[str, Any]:
        payload = {
            "aspect": record.get("aspect"),
            "state": record.get("state"),
            "updated_at": record.get("updated_at"),
        }
        if record.get("state") == "ready":
            payload["file"] = f"/v1/library/video/{record.get('filename')}"
        if record.get("state") == "failed":
            payload["error"] = record.get("error") or "Visualizer rendering failed"
        return payload
