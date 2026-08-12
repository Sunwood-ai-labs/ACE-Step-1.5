"""Small asynchronous client for ACE-Step Forge's existing REST API."""

from __future__ import annotations

import json
from typing import Any
from urllib.parse import urljoin

import httpx

from acestep.mcp_config import McpSettings


class AceStepApiError(RuntimeError):
    """Raised when the upstream ACE-Step REST API cannot fulfill an MCP request."""


class AceStepApiClient:
    """Translate MCP operations into the stable Forge REST API contract."""

    def __init__(
        self,
        settings: McpSettings,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        """Create a REST client using the configured upstream and public API URLs."""

        self._settings = settings
        self._transport = transport

    async def get_health(self) -> dict[str, Any]:
        """Return the API health payload used to check generation readiness."""

        return await self._request_json("GET", "/health")

    async def submit_generation(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Queue a music generation job and return its API task identifier."""

        data = await self._request_json("POST", "/release_task", json_body=payload)
        if not isinstance(data.get("task_id"), str):
            raise AceStepApiError("The generation API did not return a task_id.")
        return data

    async def get_generation_status(self, job_id: str) -> dict[str, Any]:
        """Return one normalized job status and its catalog-owned audio when complete."""

        data = await self._request_json("POST", "/query_result", json_body={"task_id_list": [job_id]})
        if not isinstance(data, list) or not data or not isinstance(data[0], dict):
            raise AceStepApiError("The generation API returned an invalid task status payload.")
        status = data[0]
        normalized = _normalize_status(job_id, status)
        if normalized["state"] == "succeeded":
            normalized["library_items"] = await self.find_library_items(job_id)
        return normalized

    async def list_library(self, limit: int) -> list[dict[str, Any]]:
        """Return recent shared Library items with public-safe audio URLs."""

        data = await self._request_json("GET", f"/v1/library?limit={limit}")
        raw_items = data.get("items") if isinstance(data, dict) else None
        if not isinstance(raw_items, list):
            raise AceStepApiError("The Library API returned an invalid item list.")
        return [self._public_library_item(item) for item in raw_items if isinstance(item, dict)]

    async def find_library_items(self, job_id: str) -> list[dict[str, Any]]:
        """Find catalog items created by one generation job."""

        items = await self.list_library(limit=60)
        return [item for item in items if str(item.get("id", "")).split(":", 1)[0] == job_id]

    async def _request_json(
        self,
        method: str,
        path: str,
        json_body: dict[str, Any] | None = None,
    ) -> Any:
        """Call one REST endpoint and unwrap the Forge API response envelope."""

        headers = {"Accept": "application/json"}
        if self._settings.upstream_api_key:
            headers["Authorization"] = f"Bearer {self._settings.upstream_api_key}"
        url = f"{self._settings.api_base_url}{path}"
        try:
            async with httpx.AsyncClient(
                timeout=self._settings.request_timeout_seconds,
                transport=self._transport,
            ) as client:
                response = await client.request(method, url, headers=headers, json=json_body)
        except httpx.HTTPError as exc:
            raise AceStepApiError(f"Could not reach ACE-Step API at {self._settings.api_base_url}.") from exc

        try:
            payload = response.json()
        except ValueError as exc:
            raise AceStepApiError(f"ACE-Step API returned non-JSON HTTP {response.status_code}.") from exc

        if not response.is_success or not isinstance(payload, dict) or int(payload.get("code", 200)) >= 400:
            detail = payload.get("error") if isinstance(payload, dict) else None
            raise AceStepApiError(str(detail or f"ACE-Step API returned HTTP {response.status_code}."))
        return payload.get("data")

    def _public_library_item(self, item: dict[str, Any]) -> dict[str, Any]:
        """Remove internal fields and turn a catalog-relative audio path into a usable URL."""

        result = item.get("result") if isinstance(item.get("result"), dict) else {}
        audio_path = str(result.get("file") or "")
        return {
            "id": str(item.get("id") or ""),
            "created_at": item.get("created_at"),
            "task_type": str(item.get("task_type") or "text2music"),
            "state": str(item.get("state") or "ready"),
            "audio": {
                "filename": str(result.get("filename") or ""),
                "path": audio_path,
                "url": _public_url(self._settings.public_api_base_url, audio_path),
            },
            "prompt": str(result.get("prompt") or ""),
            "lyrics": str(result.get("lyrics") or ""),
            "metadata": result.get("metas") if isinstance(result.get("metas"), dict) else {},
            "seed": str(result.get("seed_value") or ""),
            "model": str(result.get("dit_model") or ""),
        }


def _normalize_status(job_id: str, status: dict[str, Any]) -> dict[str, Any]:
    """Convert the legacy integer status response into an MCP-friendly job object."""

    result_items = _decode_result_items(status.get("result"))
    first_result = result_items[0] if result_items else {}
    status_code = int(status.get("status", 0))
    state = "succeeded" if status_code == 1 else "failed" if status_code == 2 else "running"
    return {
        "job_id": job_id,
        "state": state,
        "progress": first_result.get("progress"),
        "stage": str(
            first_result.get("stage")
            or ("complete" if state == "succeeded" else "failed" if state == "failed" else "running")
        ),
        "progress_text": str(status.get("progress_text") or ""),
        "error": first_result.get("error") if state == "failed" else None,
        "library_items": [],
    }


def _decode_result_items(value: Any) -> list[dict[str, Any]]:
    """Decode the JSON-encoded legacy result field without raising on malformed input."""

    if isinstance(value, list):
        return [item for item in value if isinstance(item, dict)]
    if not isinstance(value, str):
        return []
    try:
        decoded = json.loads(value)
    except json.JSONDecodeError:
        return []
    return [item for item in decoded if isinstance(item, dict)] if isinstance(decoded, list) else []


def _public_url(base_url: str, path: str) -> str:
    """Return an absolute browser/client URL for one catalog audio path."""

    if path.startswith(("http://", "https://")):
        return path
    return urljoin(f"{base_url}/", path.lstrip("/")) if path else ""
