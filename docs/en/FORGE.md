# Forge workspace

ACE-Step Forge is a local-first workspace built around the official ACE-Step
1.5 REST API. It does not replace the upstream model runtime or its bundled
Gradio UI. Instead, it gives the normal local workflow a dedicated interface:
create a job, follow its status, retain its finished audio, and play it back.

![A completed Forge track playing in the Library](/images/forge-library-playback.png)

## Start the stack

```powershell
Copy-Item .env.example .env
docker compose up -d --build
docker compose ps
```

Open `http://localhost:3000`. Set `FORGE_PORT` in `.env` if that port is already
occupied. Forge proxies browser requests through `/api`, so the browser does
not need a separate API origin or a CORS exception.

## Workspace routes

| Route | What it is for |
| --- | --- |
| **Create** (`/`) | Start text, cover, or repaint generation using the existing ACE-Step API. |
| **Library** (`/library`) | See the shared completed collection, play audio in the browser, download it, or remove a Library record. |
| **MCP** (`/mcp`) | Copy working Claude Code and Codex CLI setup commands; review the exposed tools and local-only security posture. |
| **System** (`/system`) | Inspect service reachability and configure a browser-local API token when the underlying API requires one. |

## What makes Library shared

When an API job succeeds, Forge stores the returned audio under
`gradio_outputs/forge-library/audio` and writes its catalog under
`gradio_outputs/forge-library`. The Library route reads that server-side catalog;
it does not depend on one browser's local storage.

This is why the end-to-end release check is important:

1. Submit a short generation from **Create**.
2. Wait for **Ready**.
3. Open **Library** and confirm the new row appears.
4. Start the native browser audio player and confirm its time counter advances.

## API boundary

| Forge behavior | ACE-Step endpoint |
| --- | --- |
| Service status and model information | `GET /health`, `GET /v1/models` |
| Create a task | `POST /release_task` |
| Poll task status | `POST /query_result` |
| Play/download finished audio | proxied `/v1/audio` URL |

The upstream Gradio application is still available separately:

```powershell
docker compose --profile legacy up acestep-gradio
```

Do not run a model-loaded legacy Gradio container next to a model-loaded API
worker on one GPU unless the card has sufficient VRAM for both.

Next: [connect a coding agent through MCP](./MCP) or [configure a 12 GB GPU](./GPU_12GB).
