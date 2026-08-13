"""HTTP routes for local Forge audio-visualizer videos."""

from __future__ import annotations

from typing import Any, Callable, Dict, Literal, Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel


class VisualizerRequest(BaseModel):
    """The requested presentation format for one Library track."""

    aspect: Literal["landscape", "portrait"] = "portrait"


def register_visualizer_routes(
    app: FastAPI,
    *,
    verify_api_key: Callable[..., Any],
    verify_token_from_request: Callable[[dict, Optional[str]], Optional[str]],
    wrap_response: Callable[..., Dict[str, Any]],
    visualizer_service: Any,
) -> None:
    """Register authenticated render, status, and MP4 playback endpoints."""

    @app.post("/v1/library/{item_id}/visualizers", status_code=202)
    async def create_visualizer(
        item_id: str,
        payload: VisualizerRequest,
        authorization: Optional[str] = Header(None),
    ) -> Dict[str, Any]:
        """Queue one local visualizer render for an existing Library item."""

        verify_token_from_request({}, authorization)
        try:
            asset = visualizer_service.request_render(item_id, payload.aspect)
        except FileNotFoundError as error:
            raise HTTPException(status_code=404, detail=str(error)) from error
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error)) from error
        return wrap_response(asset, code=202)

    @app.get("/v1/library/video/{filename}")
    async def get_visualizer_video(filename: str, _: None = Depends(verify_api_key)) -> FileResponse:
        """Stream one ready, catalog-owned MP4 without exposing local paths."""

        video_path = visualizer_service.resolve_video(filename)
        if video_path is None:
            raise HTTPException(status_code=404, detail="Visualizer video not found")
        return FileResponse(str(video_path), media_type="video/mp4")
