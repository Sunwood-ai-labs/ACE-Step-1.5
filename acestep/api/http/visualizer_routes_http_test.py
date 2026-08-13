"""HTTP tests for Forge visualizer endpoints and Library annotations."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.testclient import TestClient

from acestep.api.http.library_routes import register_library_routes
from acestep.api.http.visualizer_routes import register_visualizer_routes
from acestep.api.library_store import LibraryStore


def _wrap_response(data: Any, code: int = 200, error: str | None = None) -> dict[str, Any]:
    """Return the standard Forge API envelope for this integration test."""

    return {"data": data, "code": code, "error": error}


async def _verify_api_key() -> None:
    """Allow protected MP4 playback in this route integration test."""


def _verify_token(_body: dict[str, Any], _authorization: str | None) -> None:
    """Allow visualizer mutation requests in this route integration test."""


class _VisualizerService:
    """Small in-memory stand-in for verifying the public HTTP contract."""

    def __init__(self, video: Path) -> None:
        """Use a known MP4 path for the playback endpoint."""

        self._video = video
        self.removed: list[str] = []

    def list_for_item(self, _item_id: str) -> list[dict[str, Any]]:
        """Return one ready landscape asset for Library annotation checks."""

        return [{"aspect": "landscape", "state": "ready", "updated_at": 1, "file": "/v1/library/video/take.mp4"}]

    def request_render(self, _item_id: str, aspect: str) -> dict[str, Any]:
        """Return the immediate asynchronous render status."""

        return {"aspect": aspect, "state": "rendering", "updated_at": 2}

    def resolve_video(self, filename: str) -> Path | None:
        """Resolve only the catalog video fixture."""

        return self._video if filename == "take.mp4" else None

    def remove_for_item(self, item_id: str) -> None:
        """Record the Library cleanup request."""

        self.removed.append(item_id)


class VisualizerRoutesHttpTests(unittest.TestCase):
    """Ensure the browser receives status, playback, and deletion cleanup routes."""

    def test_exposes_visualizers_for_a_library_item(self) -> None:
        """Listing, rendering, playback, and item deletion share one HTTP contract."""

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "take.mp3"
            video = root / "take.mp4"
            source.write_bytes(b"test-audio")
            video.write_bytes(b"test-video")
            library = LibraryStore(str(root / "library"))
            item = library.record_success(
                job_id="job-1",
                result={"raw_audio_paths": [str(source)]},
                prompt="koto rock",
                lyrics="",
                task_type="text2music",
            )[0]
            service = _VisualizerService(video)
            app = FastAPI()
            register_library_routes(
                app,
                verify_api_key=_verify_api_key,
                verify_token_from_request=_verify_token,
                wrap_response=_wrap_response,
                library_store=library,
                visualizer_service=service,
            )
            register_visualizer_routes(
                app,
                verify_api_key=_verify_api_key,
                verify_token_from_request=_verify_token,
                wrap_response=_wrap_response,
                visualizer_service=service,
            )
            client = TestClient(app)

            listing = client.get("/v1/library").json()["data"]["items"][0]
            self.assertEqual("ready", listing["visualizers"][0]["state"])
            created = client.post(f"/v1/library/{item['id']}/visualizers", json={"aspect": "portrait"})
            self.assertEqual(202, created.status_code)
            self.assertEqual("rendering", created.json()["data"]["state"])
            default_created = client.post(f"/v1/library/{item['id']}/visualizers", json={})
            self.assertEqual("portrait", default_created.json()["data"]["aspect"])
            self.assertEqual(422, client.post(f"/v1/library/{item['id']}/visualizers", json={"aspect": "square"}).status_code)
            playback = client.get("/v1/library/video/take.mp4")
            self.assertEqual(200, playback.status_code)
            self.assertEqual(b"test-video", playback.content)
            self.assertEqual(404, client.get("/v1/library/video/missing.mp4").status_code)
            self.assertEqual(200, client.delete(f"/v1/library/{item['id']}").status_code)
            self.assertEqual([item["id"]], service.removed)


if __name__ == "__main__":
    unittest.main()
