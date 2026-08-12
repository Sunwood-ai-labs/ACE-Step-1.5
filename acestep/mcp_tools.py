"""Music-generation tools exposed by the ACE-Step Forge MCP server."""

from __future__ import annotations

import asyncio
from typing import Any

from loguru import logger
from mcp.server import MCPServer

from acestep.mcp_api_client import AceStepApiClient, AceStepApiError


def register_music_tools(server: MCPServer, client: AceStepApiClient) -> None:
    """Register the generation, polling, Library, and health tools on one MCP server."""

    @server.tool(
        title="Generate music",
        description="Queue a text-to-music job. Call get_generation_status or wait_for_generation next.",
        structured_output=True,
    )
    async def generate_music(
        prompt: str,
        duration_seconds: float = 30.0,
        lyrics: str = "",
        vocal_language: str = "ja",
        thinking: bool = False,
        bpm: int | None = None,
        seed: int | None = None,
        track_name: str | None = None,
    ) -> dict[str, Any]:
        """Queue one MP3 generation; leave lyrics empty to request an instrumental track."""

        if not prompt.strip():
            return _error_result("prompt must not be empty")
        if not 10.0 <= duration_seconds <= 600.0:
            return _error_result("duration_seconds must be between 10 and 600")
        if bpm is not None and not 20 <= bpm <= 320:
            return _error_result("bpm must be between 20 and 320")
        payload: dict[str, Any] = {
            "prompt": prompt.strip(),
            "lyrics": lyrics.strip(),
            "task_type": "text2music",
            "audio_duration": duration_seconds,
            "audio_format": "mp3",
            "vocal_language": vocal_language.strip() or "ja",
            "thinking": thinking,
            "use_random_seed": seed is None,
            "batch_size": 1,
        }
        if bpm is not None:
            payload["bpm"] = bpm
        if seed is not None:
            payload["seed"] = seed
        if track_name and track_name.strip():
            payload["track_name"] = track_name.strip()
        try:
            queued = await client.submit_generation(payload)
        except AceStepApiError as exc:
            logger.warning("MCP generation submission failed: {}", exc)
            return _error_result(str(exc))
        return {
            "job_id": queued["task_id"],
            "state": "queued",
            "queue_position": queued.get("queue_position"),
            "next_step": "Call wait_for_generation with this job_id, or poll get_generation_status.",
        }

    @server.tool(
        title="Get generation status",
        description="Check a queued generation. A completed result includes shared Library audio URLs.",
        structured_output=True,
    )
    async def get_generation_status(job_id: str) -> dict[str, Any]:
        """Return normalized state, progress, errors, and catalog-owned audio for a job."""

        return await _get_status(client, job_id)

    @server.tool(
        title="Wait for generation",
        description="Poll a queued generation until it finishes or the timeout expires.",
        structured_output=True,
    )
    async def wait_for_generation(
        job_id: str,
        timeout_seconds: int = 300,
        poll_interval_seconds: float = 5.0,
    ) -> dict[str, Any]:
        """Wait for a terminal job state while keeping the Library result in the response."""

        timeout = min(900, max(1, timeout_seconds))
        interval = min(30.0, max(1.0, poll_interval_seconds))
        deadline = asyncio.get_running_loop().time() + timeout
        while True:
            status = await _get_status(client, job_id)
            if status.get("state") in {"succeeded", "failed", "error"}:
                return status
            if asyncio.get_running_loop().time() >= deadline:
                status["timed_out"] = True
                status["next_step"] = "Call get_generation_status later with the same job_id."
                return status
            await asyncio.sleep(interval)

    @server.tool(
        title="List music library",
        description="List recent completed tracks. Returned audio URLs are safe shared Library endpoints.",
        structured_output=True,
    )
    async def list_music_library(limit: int = 20) -> dict[str, Any]:
        """Return up to 60 completed tracks that can be played from the shared Library."""

        try:
            return {"items": await client.list_library(min(60, max(1, limit)))}
        except AceStepApiError as exc:
            logger.warning("MCP Library lookup failed: {}", exc)
            return _error_result(str(exc))

    @server.tool(
        title="Get music server status",
        description="Check whether the ACE-Step generation API is online and models are initialized.",
        structured_output=True,
    )
    async def get_music_server_status() -> dict[str, Any]:
        """Return the upstream health response before starting a generation workflow."""

        try:
            return {"state": "ready", "api": await client.get_health()}
        except AceStepApiError as exc:
            logger.warning("MCP health check failed: {}", exc)
            return _error_result(str(exc))


async def _get_status(client: AceStepApiClient, job_id: str) -> dict[str, Any]:
    """Return a tool-readable status without leaking an upstream exception to the protocol."""

    if not job_id.strip():
        return _error_result("job_id must not be empty")
    try:
        return await client.get_generation_status(job_id.strip())
    except AceStepApiError as exc:
        logger.warning("MCP job status lookup failed: {}", exc)
        return _error_result(str(exc))


def _error_result(message: str) -> dict[str, Any]:
    """Return a structured, agent-readable error result for an expected tool failure."""

    return {"state": "error", "error": message}
