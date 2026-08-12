"""Streamable HTTP MCP gateway for generating music through ACE-Step Forge."""

from __future__ import annotations

import secrets
from typing import Any

import uvicorn
from mcp.server import MCPServer
from mcp.server.transport_security import TransportSecuritySettings
from starlette.applications import Starlette
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from acestep.mcp_api_client import AceStepApiClient
from acestep.mcp_config import McpSettings
from acestep.mcp_tools import register_music_tools


class StaticBearerAuthMiddleware(BaseHTTPMiddleware):
    """Require a configured static bearer token only for the MCP route."""

    def __init__(self, app: Any, token: str) -> None:
        """Create middleware that compares incoming bearer tokens safely."""

        super().__init__(app)
        self._token = token

    async def dispatch(self, request: Request, call_next: Any) -> Response:
        """Reject unauthenticated MCP traffic while leaving the health probe public."""

        if request.url.path == "/mcp":
            token = request.headers.get("authorization", "").removeprefix("Bearer ")
            if not token or not secrets.compare_digest(token, self._token):
                return JSONResponse(
                    {"error": "MCP bearer token required"},
                    status_code=401,
                    headers={"WWW-Authenticate": "Bearer"},
                )
        return await call_next(request)


def create_server(
    settings: McpSettings | None = None,
    api_client: AceStepApiClient | None = None,
) -> MCPServer:
    """Create the MCP tool server backed by the configured Forge REST API."""

    runtime = settings or McpSettings.from_environment()
    client = api_client or AceStepApiClient(runtime)
    server = MCPServer(
        "ACE-Step Forge",
        title="ACE-Step Forge Music Generation",
        description="Generate music with ACE-Step Forge and retrieve it from the shared Library.",
        version="1.5.0",
    )
    register_music_tools(server, client)

    @server.custom_route("/health", methods=["GET"])
    async def health_check(_: Request) -> Response:
        """Expose a lightweight unauthenticated liveness endpoint for Docker Compose."""

        return JSONResponse({"status": "ok", "service": "ACE-Step Forge MCP"})

    return server


def create_app(
    settings: McpSettings | None = None,
    api_client: AceStepApiClient | None = None,
) -> Starlette:
    """Build the standalone Streamable HTTP ASGI app exposed at ``/mcp``."""

    runtime = settings or McpSettings.from_environment()
    server = create_server(runtime, api_client)
    security = TransportSecuritySettings(
        enable_dns_rebinding_protection=True,
        allowed_hosts=list(runtime.allowed_hosts),
        allowed_origins=list(runtime.allowed_origins),
    )
    app = server.streamable_http_app(
        json_response=True,
        stateless_http=True,
        transport_security=security,
    )
    if runtime.mcp_api_key:
        app.add_middleware(StaticBearerAuthMiddleware, token=runtime.mcp_api_key)
    return app


app = create_app()


def main() -> None:
    """Run the standalone MCP ASGI server with the current environment settings."""

    settings = McpSettings.from_environment()
    uvicorn.run(app, host=settings.bind_host, port=settings.port)


if __name__ == "__main__":
    main()
