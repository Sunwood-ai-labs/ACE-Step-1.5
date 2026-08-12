"""Configuration helpers for the ACE-Step Forge Streamable HTTP MCP server."""

from __future__ import annotations

import os
from dataclasses import dataclass


_LOCAL_ALLOWED_HOSTS = ("127.0.0.1:*", "localhost:*", "[::1]:*")
_LOCAL_ALLOWED_ORIGINS = (
    "http://127.0.0.1:*",
    "http://localhost:*",
    "http://[::1]:*",
)


@dataclass(frozen=True)
class McpSettings:
    """Runtime configuration for the MCP gateway and its upstream REST API."""

    api_base_url: str
    public_api_base_url: str
    upstream_api_key: str | None
    mcp_api_key: str | None
    bind_host: str
    port: int
    request_timeout_seconds: float
    allowed_hosts: tuple[str, ...]
    allowed_origins: tuple[str, ...]

    @classmethod
    def from_environment(cls) -> "McpSettings":
        """Build settings from environment variables with safe localhost defaults."""

        api_base_url = _normalized_url(os.getenv("ACESTEP_MCP_API_BASE_URL", "http://127.0.0.1:8001"))
        public_url = _normalized_url(os.getenv("ACESTEP_MCP_PUBLIC_API_BASE_URL", api_base_url))
        return cls(
            api_base_url=api_base_url,
            public_api_base_url=public_url,
            upstream_api_key=_optional_env("ACESTEP_API_KEY"),
            mcp_api_key=_optional_env("ACESTEP_MCP_API_KEY"),
            bind_host=os.getenv("ACESTEP_MCP_BIND_HOST", "127.0.0.1").strip() or "127.0.0.1",
            port=_bounded_int("ACESTEP_MCP_PORT", default=8002, minimum=1, maximum=65535),
            request_timeout_seconds=_bounded_float(
                "ACESTEP_MCP_REQUEST_TIMEOUT_SECONDS", default=30.0, minimum=1.0, maximum=300.0
            ),
            allowed_hosts=_unique(_LOCAL_ALLOWED_HOSTS + _csv_env("ACESTEP_MCP_ALLOWED_HOSTS")),
            allowed_origins=_unique(_LOCAL_ALLOWED_ORIGINS + _csv_env("ACESTEP_MCP_ALLOWED_ORIGINS")),
        )


def _optional_env(name: str) -> str | None:
    """Return a stripped optional environment value."""

    value = os.getenv(name, "").strip()
    return value or None


def _normalized_url(value: str) -> str:
    """Normalize a configured HTTP base URL without adding a path."""

    normalized = value.strip().rstrip("/")
    if not normalized.startswith(("http://", "https://")):
        raise ValueError("MCP API base URLs must start with http:// or https://")
    return normalized


def _bounded_int(name: str, *, default: int, minimum: int, maximum: int) -> int:
    """Read an integer environment value and clamp malformed values to a default."""

    try:
        value = int(os.getenv(name, str(default)))
    except ValueError:
        return default
    return value if minimum <= value <= maximum else default


def _bounded_float(name: str, *, default: float, minimum: float, maximum: float) -> float:
    """Read a floating-point environment value and clamp malformed values to a default."""

    try:
        value = float(os.getenv(name, str(default)))
    except ValueError:
        return default
    return value if minimum <= value <= maximum else default


def _csv_env(name: str) -> tuple[str, ...]:
    """Split a comma-separated environment variable while dropping empty values."""

    return tuple(item.strip() for item in os.getenv(name, "").split(",") if item.strip())


def _unique(values: tuple[str, ...]) -> tuple[str, ...]:
    """Return values in input order with duplicates removed."""

    return tuple(dict.fromkeys(values))
