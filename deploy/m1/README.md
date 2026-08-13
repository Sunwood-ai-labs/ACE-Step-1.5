# Apple Silicon (M1) CI/CD deployment

This deployment runs the Forge **React/Nginx workspace** on an Apple Silicon
Mac and forwards its same-origin `/api` requests to an existing ACE-Step API
host over Tailscale. GitHub Actions deploys directly on a self-hosted runner
installed on that Mac; the initial runner setup can be performed over SSH.

The current ACE-Step backend image is built from `nvidia/cuda` and reserves an
NVIDIA device in Compose. It is not the right image for an M1 Mac. The M1
workflow therefore deploys the ARM64 UI edge only; music generation and the
shared Library remain on the NVIDIA host.

## GitHub configuration

Create this repository Actions secret (or put it in the `m1-production`
environment):

| Name | Value |
| --- | --- |
| `M1_API_UPSTREAM` | GPU API address as `host:port`, for example `100.92.144.53:8001` (no scheme) |

Set the repository variable `M1_DEPLOY_ENABLED` to `true` to enable automatic
deployment on pushes to `main` that touch the UI or deployment files. A manual
`workflow_dispatch` run can deploy without that variable.

The workflow uses the automatically provided `GITHUB_TOKEN` to publish and
pull `ghcr.io/<owner>/ace-step-forge-ui:main`; no separate registry token is
needed.

## What the workflow does

`.github/workflows/deploy-m1.yml`:

1. Builds the `frontend/` image for `linux/amd64` and `linux/arm64`.
2. Publishes immutable SHA and moving `main` tags to GHCR.
3. Runs the deploy job on the labeled `self-hosted,m1,arm64` runner on the Mac.
4. Copies `deploy/m1/compose.yml`, logs into GHCR, and restarts the UI.
5. Polls `http://127.0.0.1:3003/healthz` on the Mac before succeeding.

The Mac needs Docker Desktop with the Compose plugin, an online GitHub Actions
runner, and Tailscale access to the GPU host.

### Install the M1 runner once

Use the repository's **Settings → Actions → Runners → New self-hosted runner**
instructions for macOS/ARM64. Register it with the labels `m1,arm64` and keep
the runner process under the same macOS account that owns Docker Desktop.

## First deployment and verification

After the workflow succeeds:

```powershell
ssh <m1-user>@<m1-host> 'cd ~/ace-step-forge && docker compose ps'
curl http://<m1-host>:3003/healthz
```

Open `http://<m1-host>:3003`, check the **System** view, and submit a short
generation. The browser talks to the M1 UI, while Nginx forwards `/api` and
audio/library paths to `M1_API_UPSTREAM`.

The Mac must be able to reach the GPU host on the configured port. If the
health page loads but generation fails, test the API path from the Mac and
check the GPU host firewall/Tailscale ACLs before changing the UI deployment.

## Current limitation

This is an edge/UI deployment. Running the ACE-Step model itself on the M1
requires a separate CPU/MPS backend image and is not provided by this workflow.
