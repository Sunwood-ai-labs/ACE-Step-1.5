"""Focused tests for the REST adapter used by ACE-Step Forge MCP tools."""

from __future__ import annotations

import json
import unittest

import httpx

from acestep.mcp_api_client import AceStepApiClient
from acestep.mcp_config import McpSettings


def _settings() -> McpSettings:
    """Return deterministic settings for HTTP transport tests."""

    return McpSettings(
        api_base_url="http://acestep.test",
        public_api_base_url="https://forge.example.test/api",
        upstream_api_key="upstream-secret",
        mcp_api_key=None,
        bind_host="127.0.0.1",
        port=8002,
        request_timeout_seconds=5.0,
        allowed_hosts=("localhost:*",),
        allowed_origins=("http://localhost:*",),
    )


class TestAceStepApiClient(unittest.IsolatedAsyncioTestCase):
    """Verify REST envelope translation without requiring GPU inference."""

    async def test_submit_generation_forwards_auth_and_returns_task(self) -> None:
        """A normal MCP submission should retain the API's queued task ID."""

        def handler(request: httpx.Request) -> httpx.Response:
            self.assertEqual("Bearer upstream-secret", request.headers["authorization"])
            self.assertEqual("/release_task", request.url.path)
            self.assertEqual("festival rock", json.loads(request.content)["prompt"])
            return httpx.Response(200, json={"code": 200, "data": {"task_id": "job-1"}})

        client = AceStepApiClient(_settings(), httpx.MockTransport(handler))
        result = await client.submit_generation({"prompt": "festival rock"})

        self.assertEqual("job-1", result["task_id"])

    async def test_completed_job_uses_shared_library_audio_url(self) -> None:
        """A completed job should expose only its Library-owned audio endpoint."""

        def handler(request: httpx.Request) -> httpx.Response:
            if request.url.path == "/query_result":
                return httpx.Response(
                    200,
                    json={
                        "code": 200,
                        "data": [
                            {
                                "task_id": "job-2",
                                "status": 1,
                                "progress_text": "done",
                                "result": json.dumps([{"status": 1}]),
                            }
                        ],
                    },
                )
            self.assertEqual("/v1/library", request.url.path)
            return httpx.Response(
                200,
                json={
                    "code": 200,
                    "data": {
                        "items": [
                            {
                                "id": "job-2:0",
                                "created_at": 123,
                                "task_type": "text2music",
                                "state": "ready",
                                "result": {
                                    "filename": "job-2-0.mp3",
                                    "file": "/v1/library/audio/job-2-0.mp3",
                                    "prompt": "festival rock",
                                    "lyrics": "",
                                    "metas": {"duration": 30},
                                },
                            }
                        ]
                    },
                },
            )

        client = AceStepApiClient(_settings(), httpx.MockTransport(handler))
        result = await client.get_generation_status("job-2")

        self.assertEqual("succeeded", result["state"])
        self.assertEqual(
            "https://forge.example.test/api/v1/library/audio/job-2-0.mp3",
            result["library_items"][0]["audio"]["url"],
        )

    async def test_failed_job_does_not_query_library(self) -> None:
        """A failed job should return its error without pretending Library audio exists."""

        def handler(request: httpx.Request) -> httpx.Response:
            self.assertEqual("/query_result", request.url.path)
            return httpx.Response(
                200,
                json={
                    "code": 200,
                    "data": [
                        {
                            "task_id": "job-3",
                            "status": 2,
                            "result": json.dumps([{"error": "GPU unavailable"}]),
                        }
                    ],
                },
            )

        client = AceStepApiClient(_settings(), httpx.MockTransport(handler))
        result = await client.get_generation_status("job-3")

        self.assertEqual("failed", result["state"])
        self.assertEqual("failed", result["stage"])
        self.assertEqual("GPU unavailable", result["error"])
        self.assertEqual([], result["library_items"])
