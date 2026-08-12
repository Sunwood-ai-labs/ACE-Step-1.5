"""Tests for shared Forge library persistence."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from acestep.api.library_store import LibraryStore


class LibraryStoreTests(unittest.TestCase):
    """Verify catalog persistence, audio copying, and safe deletion behavior."""

    def test_records_and_lists_a_completed_generation_without_source_paths(self) -> None:
        """A successful generation should become a shared, safe-to-serve catalog item."""

        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "source.mp3"
            source.write_bytes(b"generated-audio")
            store = LibraryStore(str(Path(directory) / "library"))

            entries = store.record_success(
                job_id="job-1",
                result={
                    "raw_audio_paths": [str(source)],
                    "metas": {"bpm": 168, "duration": 30, "keyscale": "E minor"},
                    "dit_model": "acestep-v15-turbo",
                },
                prompt="night sakura rock",
                lyrics="run into dawn",
                task_type="text2music",
                created_at=1_786_500_000.0,
            )

            self.assertEqual(1, len(entries))
            item = store.list_items()[0]
            self.assertEqual("job-1:0", item["id"])
            self.assertEqual("night sakura rock", item["result"]["prompt"])
            self.assertNotIn(str(source), (Path(directory) / "library" / "library.json").read_text())
            audio = store.resolve_audio(item["result"]["filename"])
            self.assertIsNotNone(audio)
            self.assertEqual(b"generated-audio", audio.read_bytes())

    def test_removal_deletes_only_the_catalog_managed_audio_file(self) -> None:
        """Removal should clear its item and reject path-traversal lookup attempts."""

        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "source.mp3"
            source.write_bytes(b"generated-audio")
            store = LibraryStore(str(Path(directory) / "library"))
            item = store.record_success(
                job_id="job-2",
                result={"raw_audio_paths": [str(source)]},
                prompt="taiko rock",
                lyrics="",
                task_type="text2music",
            )[0]

            audio = store.resolve_audio(item["result"]["filename"])
            self.assertIsNotNone(audio)
            self.assertTrue(store.remove(item["id"]))
            self.assertEqual([], store.list_items())
            self.assertFalse(audio.exists())
            self.assertIsNone(store.resolve_audio("../source.mp3"))


if __name__ == "__main__":
    unittest.main()
