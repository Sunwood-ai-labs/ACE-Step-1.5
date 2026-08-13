<p align="center">
  <img src="./docs/public/images/ace-step-forge-header.png" width="100%" alt="ACE-STEP FORGE — local-first AI music workspace">
</p>

<h1 align="center">ACE-Step Forge</h1>

<p align="center">
  A local-first music workspace and Streamable HTTP MCP gateway for <a href="https://github.com/ace-step/ACE-Step-1.5">ACE-Step 1.5</a>.
</p>

<p align="center">
  <a href="./README.ja.md">日本語</a> ·
  <a href="https://sunwood-ai-labs.github.io/ace-step-forge/">Documentation</a> ·
  <a href="https://github.com/Sunwood-ai-labs/ace-step-forge/issues">Issues</a> ·
  <a href="./LICENSE">MIT License</a>
</p>

> **Fork relationship.** Forge is an independently maintained MIT fork of
> [ace-step/ACE-Step-1.5](https://github.com/ace-step/ACE-Step-1.5). It keeps
> the upstream ACE-Step engine, API, and Gradio UI, and adds a focused React
> workspace, a shared server-side Library, Docker Compose operations, and an
> MCP bridge for coding agents. It is not affiliated with ACEMusic or the
> upstream ACE-Step team.

## ✨ The Forge workflow

![ACE-Step Forge Library with a generated Japanese rock instrumental playing](./docs/public/images/forge-library-playback.png)

<sub>Captured from the running local Forge app after starting playback from the shared Library.</sub>

Forge makes the normal creative loop explicit:

```text
Create in Forge ──► ACE-Step generation queue ──► shared Library ──► play / download / visualizer MP4
Claude Code or Codex ───────────────────────────► same queue ─────► same Library
```

- **Create** — write a prompt, select the generation controls, and submit to
  the existing ACE-Step API.
- **Library** — completed audio is copied to `gradio_outputs/forge-library`,
  so it is shared by the Forge service rather than remembered only by one
  browser.
- **Visualizer** — choose a 16:9 or social-first 9:16 frame for a finished
  take and Forge renders a local H.264/AAC MP4 with a title card, generation
  details, and an audio-reactive waveform. It stays alongside the shared
  Library assets; no audio is uploaded to an external video service.
- **MCP** — Claude Code, Codex CLI, and compatible clients can call the same
  queue through a local Streamable HTTP endpoint.
- **Legacy Gradio** — the official upstream Gradio UI remains available through
  the opt-in `legacy` Compose profile.

## ⚡ Start Forge with Docker Compose

### Prerequisites

- Docker Desktop (Linux containers) with NVIDIA GPU support, or Docker Engine
  plus the NVIDIA Container Toolkit.
- An NVIDIA driver and an ACE-Step-compatible GPU. The model checkpoints are
  downloaded or loaded on the first generation.

```powershell
git clone https://github.com/Sunwood-ai-labs/ace-step-forge.git
Set-Location ace-step-forge
Copy-Item .env.example .env

# Prefer a stable GPU UUID over a numeric index.
nvidia-smi -L
# Edit .env and set, for example:
# ACESTEP_GPU_DEVICE_ID=GPU-<your-GPU-uuid>

docker compose up -d --build
docker compose ps
```

Open the workspace at <http://localhost:3000>. The local services are:

| Service | Local address | Purpose |
| --- | --- | --- |
| Forge workspace | <http://localhost:3000> | Create, Library, MCP instructions, and System status |
| ACE-Step REST API | <http://localhost:8001> | Scripts and integrations |
| MCP gateway | <http://127.0.0.1:8002/mcp> | Local coding-agent connection |
| Upstream Gradio UI | <http://localhost:7860> | `docker compose --profile legacy up acestep-gradio` |

If port `3000` is in use, set `FORGE_PORT=3002` in `.env` and open that port
instead. The browser still talks only to Forge's same-origin `/api` proxy.

### Apple Silicon M1 all-in-one runtime

The [`deploy/m1/`](./deploy/m1/) manifest and
[GitHub Actions workflow](./.github/workflows/deploy-m1.yml) deploy the full
ARM64 stack on the Mac: UI container, native MPS/MLX API, native MCP, and the
shared Library. It does not depend on the NVIDIA workstation.

### A practical 12 GB GPU profile

Compose intentionally exposes only the GPU named by `ACESTEP_GPU_DEVICE_ID` to
the API and the optional Gradio container. Use the UUID reported by
`nvidia-smi -L`; Docker Desktop can enumerate numeric GPU indices differently
from the host.

For a 12 GB card such as an RTX 3060, this core-generation profile avoids
loading the 5 Hz language-model planner at startup:

```dotenv
ACESTEP_GPU_DEVICE_ID=GPU-<your-GPU-uuid>
ACESTEP_INIT_LLM=false
```

`ACESTEP_INIT_LLM=false` does **not** reserve or free another GPU. It disables
the optional 5 Hz planner / LLM-enhanced input features on the selected GPU,
leaving the core ACE-Step generation path available with lower VRAM pressure.
Set it back to `auto` or `true` when you deliberately want planner features and
have the VRAM budget. See the [12 GB GPU guide](./docs/en/GPU_12GB.md) for
verification commands and trade-offs.

## 🔌 Use from Claude Code or Codex

Bring up the stack, then register its local-only Streamable HTTP endpoint:

```powershell
# Claude Code
claude mcp add --transport http ace-step-forge http://127.0.0.1:8002/mcp

# Codex CLI
codex mcp add ace-step-forge --url http://127.0.0.1:8002/mcp
```

The gateway exposes five focused tools:

`generate_music`, `get_generation_status`, `wait_for_generation`,
`list_music_library`, and `get_music_server_status`.

It binds to `127.0.0.1` by default. To require authentication, set
`ACESTEP_MCP_API_KEY` in `.env` and pass the same value to the client through
an environment variable. For a Tailnet deployment, use Tailscale Serve/ACLs
and set the explicit allowed host and public API base URL described in the
[MCP guide](./docs/en/MCP.md). A Tailnet URL is private to that Tailnet, not a
public Internet endpoint.

## 📚 Documentation

- [Forge workspace overview](./docs/en/FORGE.md) — routes, storage, and the API boundary
- [MCP setup](./docs/en/MCP.md) — Claude Code, Codex, auth, and Tailnet notes
- [12 GB GPU operation](./docs/en/GPU_12GB.md) — stable UUID selection and the planner decision
- [M1 CI/CD deployment](./deploy/m1/README.md) — all-in-one ARM64 UI, API, MCP, and Library
- [React UI design and QA contract](./docs/en/REACT_FORGE.md)
- [Official ACE-Step installation and model guides](./docs/en/INSTALL.md)
- [日本語ドキュメント](./docs/ja/FORGE.md)

The GitHub Pages documentation site is published from `docs/` on pushes to
`main`.

## 🧪 Verify a local change

```powershell
docker compose config --quiet
Set-Location frontend
npm ci
npm run test
npm run build
```

For a user-visible release, also create a short track, wait until it reaches
**Ready**, open **Library**, and start the browser audio player. The Library
view is the end-to-end proof that generation and retained playback work
together.

## 🤝 Contributing and license

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a change. Forge
is released under the [MIT License](./LICENSE). Upstream ACE-Step code and model
documentation remain credited to the ACE-Step team; see the original
[ACE-Step 1.5 repository](https://github.com/ace-step/ACE-Step-1.5) for its
research, model, and ecosystem materials.

<p align="center">
  <img src="./docs/public/logo.png" width="52" alt="ACE-Step Forge icon"><br>
  <sub>ACE-Step Forge icon</sub>
</p>
