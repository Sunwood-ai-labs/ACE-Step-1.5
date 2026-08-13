#!/bin/zsh
set -euo pipefail

ROOT="${FORGE_NATIVE_ROOT:-$HOME/ace-step-forge-native}"
UV_BIN="${UV_BIN:-$HOME/.local/bin/uv}"

export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
export ACESTEP_DEVICE="${ACESTEP_DEVICE:-mps}"
export ACESTEP_LM_BACKEND="${ACESTEP_LM_BACKEND:-mlx}"
export ACESTEP_LLM_BACKEND="${ACESTEP_LLM_BACKEND:-mlx}"
export ACESTEP_INIT_LLM="${ACESTEP_INIT_LLM:-true}"
export ACESTEP_NO_INIT="${ACESTEP_NO_INIT:-true}"
export ACESTEP_CONFIG_PATH="${ACESTEP_CONFIG_PATH:-acestep-v15-turbo}"
export ACESTEP_LM_MODEL_PATH="${ACESTEP_LM_MODEL_PATH:-acestep-5Hz-lm-1.7B}"
export ACESTEP_API_HOST="${ACESTEP_API_HOST:-0.0.0.0}"
export ACESTEP_API_PORT="${ACESTEP_API_PORT:-8001}"

cd "$ROOT"
exec "$UV_BIN" run --project "$ROOT" --no-sync acestep-api \
  --host "$ACESTEP_API_HOST" \
  --port "$ACESTEP_API_PORT"
