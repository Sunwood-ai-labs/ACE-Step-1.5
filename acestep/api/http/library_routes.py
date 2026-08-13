"""HTTP routes for the shared Forge generation library."""

from __future__ import annotations

from typing import Any, Callable, Dict, Optional

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.responses import FileResponse


def register_library_routes(
    app: FastAPI,
    *,
    verify_api_key: Callable[..., Any],
    verify_token_from_request: Callable[[dict, Optional[str]], Optional[str]],
    wrap_response: Callable[..., Dict[str, Any]],
    library_store: Any,
    visualizer_service: Any = None,
) -> None:
    """Register persistent library list, removal, and audio playback routes."""

    @app.get("/v1/library")
    async def list_library(limit: int = Query(default=60, ge=1, le=60)):
        """Return recent audio items shared by every Forge client."""

        items = library_store.list_items(limit=limit)
        if visualizer_service is not None:
            for item in items:
                item["visualizers"] = visualizer_service.list_for_item(item["id"])
        return wrap_response({"items": items})

    @app.delete("/v1/library/{item_id}")
    async def delete_library_item(item_id: str, authorization: Optional[str] = Header(None)):
        """Remove one shared library item after optional API-token validation."""

        verify_token_from_request({}, authorization)
        if not library_store.remove(item_id):
            raise HTTPException(status_code=404, detail="Library item not found")
        if visualizer_service is not None:
            visualizer_service.remove_for_item(item_id)
        return wrap_response({"id": item_id, "deleted": True})

    @app.get("/v1/library/audio/{filename}")
    async def get_library_audio(filename: str, _: None = Depends(verify_api_key)):
        """Serve one catalog-owned audio file without exposing its local path."""

        audio_path = library_store.resolve_audio(filename)
        if audio_path is None:
            raise HTTPException(status_code=404, detail="Library audio not found")
        media_types = {
            ".mp3": "audio/mpeg",
            ".wav": "audio/wav",
            ".flac": "audio/flac",
            ".ogg": "audio/ogg",
            ".opus": "audio/ogg",
        }
        return FileResponse(str(audio_path), media_type=media_types.get(audio_path.suffix.lower(), "audio/mpeg"))
