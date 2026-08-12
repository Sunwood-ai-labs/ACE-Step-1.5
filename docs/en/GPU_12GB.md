# 12 GB GPU operation

This guide is for a single 12 GB card—such as an RTX 3060—when another GPU in
the same workstation should remain available for other work. The goal is not to
make a broad hardware claim; it is to make Compose choose one specific card and
keep the optional 5 Hz planner off that card when the core generation path is
the priority.

## 1. Select the GPU by UUID

List the host GPUs:

```powershell
nvidia-smi -L
```

Copy the desired `GPU-...` UUID into the ignored `.env` file:

```dotenv
ACESTEP_GPU_DEVICE_ID=GPU-<uuid-from-nvidia-smi-L>
```

Prefer the UUID to `0` or `1`. Docker Desktop can expose GPU numbers in an
order different from the host's visible order; the UUID keeps the selection
unambiguous.

## 2. Use the core-generation profile

For a 12 GB workload where LLM planning is not required, add:

```dotenv
ACESTEP_INIT_LLM=false
```

Then recreate the relevant services:

```powershell
docker compose up -d --force-recreate acestep acestep-mcp forge
```

This turns off the ACE-Step 5 Hz language-model planner at API startup. It does
not choose a GPU, and it does not itself free any other GPU. Its purpose is to
avoid the optional LLM load on the already selected 12 GB card.

| Setting | Result |
| --- | --- |
| `ACESTEP_GPU_DEVICE_ID=GPU-…` | Limits ACE-Step Compose GPU access to that exact host GPU. |
| `ACESTEP_INIT_LLM=false` | Disables optional planner / LLM-enhanced request preparation; core generation remains available. |
| `ACESTEP_INIT_LLM=auto` | Lets ACE-Step decide based on GPU detection. |
| `ACESTEP_INIT_LLM=true` | Forces planner initialization; use only with enough VRAM budget. |

## 3. Verify the actual container device

The host setting is not enough proof. Inspect the running API container:

```powershell
docker exec acestep-api uv run python -c "import torch; print(torch.cuda.device_count()); print(torch.cuda.get_device_name(0))"
```

Expected: exactly one CUDA device, with the name of the intended card. Then
confirm the UUID which Compose injected into the container:

```powershell
docker inspect acestep-api --format '{{range .Config.Env}}{{println .}}{{end}}' `
  | Select-String '^(CUDA|NVIDIA)_VISIBLE_DEVICES='
```

On Docker Desktop, `nvidia-smi` can enumerate the physical host GPUs even when
PyTorch is limited to one visible CUDA device. Use the `CUDA_VISIBLE_DEVICES` /
`NVIDIA_VISIBLE_DEVICES` inspection together with the PyTorch result above.
Finally, submit a short generation, wait until **Ready**, and play it from
Forge's **Library**. On a Windows WDDM desktop, system display processes can
still appear on another GPU; the relevant check is that ACE-Step/Docker compute
work is absent from the card you intended to reserve.

## Re-enable planning deliberately

When planner features are important, update `.env` to `ACESTEP_INIT_LLM=auto`
or `true`, recreate the API container, and check available VRAM before issuing
a generation. The Forge UI exposes what the API supports; it cannot overcome
the selected GPU's memory limit.
