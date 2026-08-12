# ACE-Step Studio (React Router + Vite)

`frontend/` is a new, independently built Web UI for the official ACE-Step
1.5 REST API. It replaces neither the Python pipeline nor the bundled Gradio
implementation: the API remains the backend contract, and Gradio is still
available through the Compose `legacy` profile.

## Run

```bash
docker compose up --build
```

Open `http://localhost:3000`. Studio proxies every `/api/*` request to the
`acestep` container at port `8001`; no browser-side API host or CORS exception
is needed. `http://localhost:8001` remains exposed for scripts.

The API uses lazy model initialization by default, so Studio can become
available before the first checkpoint download/load. Set `ACESTEP_NO_INIT=false`
in `.env` if you prefer eager initialization before the API health check passes.

If `3000` is already used on your machine, pick another host port without
changing the image: `STUDIO_PORT=3002 docker compose up --build`. The Compose
network uses `172.16.42.0/24` by default to avoid Docker Desktop's automatic
bridge-pool exhaustion; set `ACESTEP_DOCKER_SUBNET` only if that range conflicts
with a route on your own network.

To use the preserved Gradio app on its own:

```bash
docker compose --profile legacy up acestep-gradio
```

Do not launch the legacy Gradio container together with a model-loaded API on a
single GPU unless enough VRAM is available for both workers.

For local frontend development, install dependencies and point Vite at the API:

```bash
cd frontend
npm ci
VITE_API_TARGET=http://localhost:8001 npm run dev
```

## API boundary

Studio intentionally uses the existing public API contract:

| UI behavior | ACE-Step endpoint |
| --- | --- |
| Service badge and model summary | `GET /health`, `GET /v1/models` |
| Create text, cover, or repaint job | `POST /release_task` |
| Upload source/reference audio | multipart `POST /release_task` |
| Poll pending work | `POST /query_result` |
| Listen or download returned audio | proxied `/v1/audio` URL |

If `ACESTEP_API_KEY` is set, a user can enter its value on **System**. It is
stored only in that browser's local storage and sent as both the normal Bearer
header and the API's compatible `ai_token` request field. It is not embedded in
the image or persisted by the server.

## Design contract

This is an **Apple-inspired Web interface**, not an Apple-platform app and not
a claim of HIG compliance. The visual direction is a quiet, dark sound
workstation: warm editorial type, instrument-panel surfaces, one lime primary
action, and deliberately sparse status color.

| Concern | Contract |
| --- | --- |
| Purpose | Start a local generation, understand queue state, audition results, and configure the local API without leaving the app. |
| Hierarchy | Create is the primary route; Library is for completed work; System contains credentials and service facts. The single primary action is **Generate audio**. |
| Agency | Text, cover, and repaint are explicit mode buttons. Optional controls stay in a native disclosure. Removing a library record affects only browser-local metadata. |
| Feedback | API reachability, queued position, rendering, ready, failure, and empty states use text plus icons—not color alone. |
| Resilience | An unavailable API leaves navigation and form context intact, disables submission, and provides a clear recovery path. |
| Motion | Queue indicators are small and functional; `prefers-reduced-motion` disables animations and transitions. |

The Apple design-principle inspiration is purpose, agency, clear feedback,
adaptability, and restrained motion. The normative Web accessibility baseline
is WCAG 2.2 rather than Apple platform APIs.

## Accessibility implementation

- Semantic `nav`, `main`, `aside`, form labels, and live status regions.
- A visible skip link and a lime `:focus-visible` treatment on every operable
  control.
- Text labels accompany status colors and icon-only buttons have accessible
  names/tooltips.
- Controls meet or exceed 44 CSS px high in normal layout (WCAG 2.2 AA's
  minimum target-size criterion is 24 CSS px).
- CSS has no horizontal fixed-width shell; it reflows to a stacked narrow
  layout. Text uses scalable browser font sizing and must remain usable at 200%
  zoom.
- Reduced-motion preference removes nonessential transition and animation.

## QA inventory

| User-visible claim/control | Functional check | Visual state to inspect |
| --- | --- | --- |
| Create a generation | Text prompt, sample prompt, controls, and submit invoke `/release_task`; error is shown if unavailable. | Default Create view and unavailable-service state. |
| Explicit modes and file inputs | Switch Text/Cover/Repaint; Cover/Repaint reject submit without source audio; file label changes after selection. | All three selected modes. |
| Queue feedback | Poll a queued job through `/query_result`; render queued, working, ready, and failure variants. | Densest realistic queue and a returned audio player. |
| Library | Navigate via keyboard/mouse, audition returned audio, remove local record. | Empty and completed-library views. |
| System | Toggle token visibility, save/clear local setting, refresh service. | System card and online/offline service facts. |
| Responsive behavior | Navigate at desktop and 390 px touch widths; no horizontal overflow; core entry point remains clear. | Desktop and mobile viewports. |

The test target exercises API serialization, result parsing, and same-origin
audio URL construction. UI QA should additionally exercise the interaction
inventory above against a local API or mock server before a release.

## Verification commands

```bash
docker compose config --quiet
docker compose --progress plain build studio
docker build --target test -t ace-step-studio-test ./frontend
```

## Sources

- [Apple Human Interface Guidelines: Design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles)
- [Apple Human Interface Guidelines: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Apple Human Interface Guidelines: Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [WCAG focus-visible understanding](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)
- [WCAG target-size minimum understanding](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
