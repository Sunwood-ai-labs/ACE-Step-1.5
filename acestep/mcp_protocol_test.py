"""Protocol-level Streamable HTTP tests for the ACE-Step Forge MCP server."""

from __future__ import annotations

import asyncio
import socket
import unittest

import uvicorn
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

from acestep.mcp_config import McpSettings
from acestep.mcp_server import create_app


def _settings(port: int) -> McpSettings:
    """Return localhost-safe settings for a real ephemeral HTTP test server."""

    return McpSettings(
        api_base_url="http://acestep.test",
        public_api_base_url="http://localhost:8001",
        upstream_api_key=None,
        mcp_api_key=None,
        bind_host="127.0.0.1",
        port=port,
        request_timeout_seconds=5.0,
        allowed_hosts=("127.0.0.1:*",),
        allowed_origins=("http://127.0.0.1:*",),
    )


def _free_port() -> int:
    """Reserve an ephemeral localhost port long enough to obtain its number."""

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


class _FakeApiClient:
    """Minimal upstream replacement used by a real MCP protocol handshake."""

    def __init__(self) -> None:
        """Start with no generation payloads."""

        self.submitted_payload: dict[str, object] | None = None

    async def submit_generation(self, payload: dict[str, object]) -> dict[str, object]:
        """Record a request and return a deterministic queued response."""

        self.submitted_payload = payload
        return {"task_id": "mcp-job-1", "queue_position": 1}

    async def get_generation_status(self, job_id: str) -> dict[str, object]:
        """Return a terminal generation result for polling-tool compatibility."""

        return {"job_id": job_id, "state": "succeeded", "library_items": []}

    async def list_library(self, limit: int) -> list[dict[str, object]]:
        """Return a small safe library list."""

        return [{"id": "mcp-job-1:0", "audio": {"url": "http://localhost:8001/audio.mp3"}}]

    async def get_health(self) -> dict[str, object]:
        """Return deterministic generation-server health."""

        return {"status": "ok", "models_initialized": True}


class TestStreamableHttpMcpProtocol(unittest.IsolatedAsyncioTestCase):
    """Exercise the published endpoint with the official MCP client implementation."""

    async def asyncSetUp(self) -> None:
        """Run the ASGI MCP app on an ephemeral localhost port."""

        self._port = _free_port()
        self._fake_api = _FakeApiClient()
        config = uvicorn.Config(
            create_app(_settings(self._port), self._fake_api),
            host="127.0.0.1",
            port=self._port,
            log_level="critical",
        )
        self._server = uvicorn.Server(config)
        self._server_task = asyncio.create_task(self._server.serve())
        for _ in range(100):
            if self._server.started:
                return
            await asyncio.sleep(0.01)
        self._server.should_exit = True
        await self._server_task
        self.fail("MCP test server did not start")

    async def asyncTearDown(self) -> None:
        """Stop the ephemeral ASGI server after the protocol exchange."""

        self._server.should_exit = True
        await asyncio.wait_for(self._server_task, timeout=5)

    async def test_client_lists_and_calls_music_tools(self) -> None:
        """A standard Streamable HTTP client should invoke a real generation tool."""

        url = f"http://127.0.0.1:{self._port}/mcp"
        async with streamable_http_client(url) as (read_stream, write_stream):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                tools = await session.list_tools()
                names = {tool.name for tool in tools.tools}
                result = await session.call_tool(
                    "generate_music",
                    {"prompt": "Japanese festival rock", "duration_seconds": 30},
                )

        self.assertTrue({"generate_music", "wait_for_generation", "list_music_library"} <= names)
        self.assertFalse(result.is_error)
        self.assertEqual("mcp-job-1", result.structured_content["job_id"])
        self.assertEqual("mp3", self._fake_api.submitted_payload["audio_format"])
