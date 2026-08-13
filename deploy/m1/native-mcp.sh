#!/bin/zsh
set -euo pipefail

ROOT="${FORGE_NATIVE_ROOT:-$HOME/ace-step-forge-native}"
UV_BIN="${UV_BIN:-$HOME/.local/bin/uv}"
TAILSCALE_IP="$(/Applications/Tailscale.app/Contents/MacOS/Tailscale ip -4 2>/dev/null || true)"

export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
export ACESTEP_MCP_BIND_HOST="${ACESTEP_MCP_BIND_HOST:-0.0.0.0}"
export ACESTEP_MCP_PORT="${ACESTEP_MCP_PORT:-8002}"
export ACESTEP_MCP_API_BASE_URL="${ACESTEP_MCP_API_BASE_URL:-http://127.0.0.1:8001}"
export ACESTEP_MCP_PUBLIC_API_BASE_URL="${ACESTEP_MCP_PUBLIC_API_BASE_URL:-http://127.0.0.1:8001}"
export ACESTEP_MCP_ALLOWED_HOSTS="${ACESTEP_MCP_ALLOWED_HOSTS:-localhost:*,127.0.0.1:*,[::1]:*,${TAILSCALE_IP}:*}"
export ACESTEP_MCP_ALLOWED_ORIGINS="${ACESTEP_MCP_ALLOWED_ORIGINS:-http://localhost:*,http://127.0.0.1:*,http://[::1]:*,http://${TAILSCALE_IP}:*}"

cd "$ROOT"
exec "$UV_BIN" run --project "$ROOT" --no-sync acestep-mcp
