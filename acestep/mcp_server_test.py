"""Focused tests for the ACE-Step Forge MCP tool surface."""

from __future__ import annotations

import unittest
from dataclasses import replace

from fastapi.testclient import TestClient

from acestep.mcp_config import McpSettings
from acestep.mcp_server import create_app, create_server


def _settings() -> McpSettings:
    """Return deterministic settings for MCP server tests."""

    return McpSettings(
        api_base_url="http://acestep.test",
        public_api_base_url="http://localhost:8001",
        upstream_api_key=None,
        mcp_api_key=None,
        bind_host="127.0.0.1",
        port=8002,
        request_timeout_seconds=5.0,
        allowed_hosts=("testserver",),
        allowed_origins=("http://testserver",),
    )


class _FakeApiClient:
    """In-memory API replacement used to test tool payloads."""

    def __init__(self) -> None:
        """Start with no submitted payload."""

        self.submitted_payload: dict[str, object] | None = None

    async def submit_generation(self, payload: dict[str, object]) -> dict[str, object]:
        """Record the submission and return a queued job."""

        self.submitted_payload = payload
        return {"task_id": "job-4", "queue_position": 2}

    async def get_generation_status(self, job_id: str) -> dict[str, object]:
        """Return a deterministic terminal result."""

        return {"job_id": job_id, "state": "succeeded", "library_items": []}

    async def list_library(self, limit: int) -> list[dict[str, object]]:
        """Return no library items for isolated tool tests."""

        return []

    async def get_health(self) -> dict[str, object]:
        """Return a deterministic health response."""

        return {"status": "ok"}


class TestMcpServer(unittest.IsolatedAsyncioTestCase):
    """Test tool registration, validation, and the health route."""

    async def test_generate_tool_builds_library_backed_mp3_request(self) -> None:
        """The tool should turn a simple agent prompt into the expected REST request."""

        fake = _FakeApiClient()
        server = create_server(_settings(), fake)  # type: ignore[arg-type]
        result = await server.call_tool(
            "generate_music",
            {"prompt": "Japanese festival rock", "duration_seconds": 30, "seed": 1234},
        )

        self.assertEqual("job-4", result.structured_content["job_id"])
        self.assertEqual("mp3", fake.submitted_payload["audio_format"])
        self.assertFalse(fake.submitted_payload["use_random_seed"])

    async def test_generate_tool_rejects_an_unsupported_duration(self) -> None:
        """Invalid duration should not submit a generation request."""

        fake = _FakeApiClient()
        server = create_server(_settings(), fake)  # type: ignore[arg-type]
        result = await server.call_tool("generate_music", {"prompt": "test", "duration_seconds": 5})

        self.assertEqual("error", result.structured_content["state"])
        self.assertIsNone(fake.submitted_payload)

    async def test_health_route_is_available_without_mcp_handshake(self) -> None:
        """Docker Compose should be able to probe the separate MCP service directly."""

        app = create_app(_settings())
        with TestClient(app) as client:
            response = client.get("/health", headers={"host": "testserver"})

        self.assertEqual(200, response.status_code)
        self.assertEqual("ok", response.json()["status"])

    async def test_configured_bearer_token_protects_only_mcp_route(self) -> None:
        """A configured MCP token should reject unauthenticated tool requests."""

        app = create_app(replace(_settings(), mcp_api_key="test-token"))
        with TestClient(app) as client:
            response = client.post(
                "/mcp",
                headers={"host": "testserver", "content-type": "application/json"},
                json={"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}},
            )

        self.assertEqual(401, response.status_code)
        self.assertEqual("Bearer", response.headers["www-authenticate"])
