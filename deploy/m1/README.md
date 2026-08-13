# Apple Silicon (M1) all-in-one CI/CD deployment

The M1 deployment is a complete Forge runtime on one Mac:

- React/Nginx UI in an ARM64 container
- ACE-Step API natively on Apple Silicon via PyTorch MPS + MLX
- Streamable HTTP MCP natively on the same Mac
- generation outputs and the shared Library on the same filesystem

Nothing is forwarded to the NVIDIA workstation. The M1 is the runtime. The
NVIDIA Docker image remains available for a separate GPU deployment, but it is
not part of this M1 workflow.

## GitHub configuration

Set the repository variable `M1_DEPLOY_ENABLED` to `true` to enable automatic
deployment on pushes to `main` that touch the API, UI, MCP, or M1 deployment
files. A manual `workflow_dispatch` run can deploy without that variable.

The workflow uses the automatically provided `GITHUB_TOKEN` to publish and
pull `ghcr.io/<owner>/ace-step-forge-ui:main`; no separate registry token is
needed.

## What the workflow does

`.github/workflows/deploy-m1.yml`:

1. Builds and publishes the ARM64 UI image (the GHCR tag is multi-arch).
2. Runs on the labeled `self-hosted,m1,arm64` runner installed on the Mac.
3. Syncs the repository into `~/ace-step-forge-native` while preserving model
   checkpoints and generated outputs.
4. Installs the locked Python environment, native `ffmpeg`, and two LaunchAgents
   for the API and MCP services.
5. Starts the ARM64 UI edge and verifies UI, API, and MCP health on the Mac.

The first sync downloads the ACE-Step weights into the native checkpoint
directory. Keep at least 15 GB free for the turbo model, VAE, embedding, 5 Hz
LM, Python environment, and generated audio.

### Install the M1 runner once

Use the repository's **Settings → Actions → Runners → New self-hosted runner**
instructions for macOS/ARM64. Register it with the labels `m1,arm64` and keep
the runner process under the same macOS account that owns Docker Desktop.

## First deployment and verification

After the workflow succeeds:

```powershell
ssh <m1-user>@<m1-host> 'cd ~/ace-step-forge && docker compose ps'
curl http://<m1-host>:3003/healthz
curl http://<m1-host>:3003/api/health
curl http://<m1-host>:8002/health
```

Open `http://<m1-host>:3003`, submit a short generation, and confirm that the
finished track appears in **Library**. The UI, API, audio file, and MCP gateway
all run on the same M1. The Tailnet address is private to the Tailnet.

## Current limitation

Apple Silicon uses MPS/MLX rather than CUDA. Performance and model-memory
behavior differ from the RTX 3060 profile; the M1 workflow intentionally does
not reserve an NVIDIA device or contact the GPU workstation.
