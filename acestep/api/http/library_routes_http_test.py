"""HTTP tests for the shared Forge library routes."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

from acestep.api.http.library_routes import register_library_routes
from acestep.api.library_store import LibraryStore


def _wrap_response(data, code: int = 200, error: str | None = None):
    """Return the standard API envelope used by the Forge client."""

    return {"data": data, "code": code, "error": error}


async def _verify_api_key() -> None:
    """Allow audio playback in this route integration test."""


def _verify_token(_body: dict, _authorization: str | None) -> None:
    """Allow mutating library test requests without an API token."""


class LibraryRoutesHttpTests(unittest.TestCase):
    """Ensure the browser-facing routes expose and remove shared audio safely."""

    def test_lists_plays_and_removes_a_shared_library_item(self) -> None:
        """The reader can list and play a persisted item before explicitly deleting it."""

        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "take.mp3"
            source.write_bytes(b"test-audio")
            store = LibraryStore(str(Path(directory) / "library"))
            item = store.record_success(
                job_id="job-1",
                result={"raw_audio_paths": [str(source)]},
                prompt="koto rock",
                lyrics="",
                task_type="text2music",
            )[0]
            app = FastAPI()
            register_library_routes(
                app,
                verify_api_key=_verify_api_key,
                verify_token_from_request=_verify_token,
                wrap_response=_wrap_response,
                library_store=store,
            )
            client = TestClient(app)

            listing = client.get("/v1/library")
            self.assertEqual(200, listing.status_code)
            self.assertEqual(item["id"], listing.json()["data"]["items"][0]["id"])
            playback = client.get(item["result"]["file"])
            self.assertEqual(200, playback.status_code)
            self.assertEqual(b"test-audio", playback.content)
            deletion = client.delete(f"/v1/library/{item['id']}")
            self.assertEqual(200, deletion.status_code)
            self.assertEqual([], client.get("/v1/library").json()["data"]["items"])


if __name__ == "__main__":
    unittest.main()
