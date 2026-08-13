import type {
  ApiEnvelope,
  ApiHealth,
  ApiLibraryResponse,
  ApiModelInventory,
  ApiQueuedTask,
  ApiTaskStatus,
  AudioResult,
  GenerationDraft,
  VisualizerAspect,
  VisualizerAsset,
} from "./types";

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

function endpoint(path: string) {
  return `${apiBase}${path}`;
}

function tokenHeaders(apiToken: string): Record<string, string> {
  return apiToken ? { Authorization: `Bearer ${apiToken}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(endpoint(path), init);
  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !body || body.code >= 400) {
    throw new ApiError(body?.error || `ACE-Step API returned ${response.status}.`, response.status);
  }
  return body.data;
}

function numericOrUndefined(value: string) {
  return value.trim() === "" ? undefined : Number(value);
}

function requestPayload(draft: GenerationDraft, apiToken: string) {
  return {
    ...(apiToken ? { ai_token: apiToken } : {}),
    prompt: draft.prompt.trim(),
    lyrics: draft.lyrics.trim(),
    task_type: draft.taskType,
    thinking: draft.thinking,
    use_format: draft.useFormat,
    vocal_language: draft.vocalLanguage,
    audio_format: draft.audioFormat,
    ...(draft.model ? { model: draft.model } : {}),
    ...(numericOrUndefined(draft.bpm) ? { bpm: Number(draft.bpm) } : {}),
    ...(draft.keyScale ? { key_scale: draft.keyScale } : {}),
    ...(draft.timeSignature ? { time_signature: draft.timeSignature } : {}),
    ...(numericOrUndefined(draft.duration) ? { audio_duration: Number(draft.duration) } : {}),
    inference_steps: Number(draft.steps),
    guidance_scale: Number(draft.guidance),
    use_random_seed: draft.useRandomSeed,
    ...(draft.useRandomSeed || !draft.seed ? {} : { seed: Number(draft.seed) }),
    batch_size: Number(draft.batchSize),
  };
}

function formDataFromPayload(payload: Record<string, unknown>, draft: GenerationDraft) {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => form.append(key, String(value)));
  if (draft.sourceAudio) form.append("src_audio", draft.sourceAudio);
  if (draft.referenceAudio) form.append("reference_audio", draft.referenceAudio);
  return form;
}

export async function getHealth(): Promise<ApiHealth> {
  return request<ApiHealth>("/health");
}

export async function getModels(apiToken: string): Promise<string[]> {
  const response = await fetch(endpoint("/v1/models"), {
    headers: tokenHeaders(apiToken),
  });
  type ModelInventoryResponse = { data?: ApiModelInventory["models"]; models?: ApiModelInventory["models"] };
  const body = (await response.json().catch(() => null)) as ApiEnvelope<ApiModelInventory> | ModelInventoryResponse | null;
  if (!response.ok || !body) throw new ApiError(`ACE-Step API returned ${response.status}.`, response.status);

  // ACE-Step exposes both its wrapped internal inventory and the OpenRouter
  // compatible `{ object: "list", data: [...] }` response on /v1/models.
  const inventory: ModelInventoryResponse = "code" in body ? body.data : body;
  const modelList = inventory.models ?? inventory.data ?? [];
  return modelList.map((model) => (typeof model === "string" ? model : model.name ?? model.id ?? "")).filter(Boolean);
}

export async function submitTask(draft: GenerationDraft, apiToken: string): Promise<ApiQueuedTask> {
  const payload = requestPayload(draft, apiToken);
  const isUpload = Boolean(draft.sourceAudio || draft.referenceAudio);
  return request<ApiQueuedTask>("/release_task", {
    method: "POST",
    headers: isUpload ? tokenHeaders(apiToken) : { "Content-Type": "application/json", ...tokenHeaders(apiToken) },
    body: isUpload ? formDataFromPayload(payload, draft) : JSON.stringify(payload),
  });
}

export async function queryTasks(taskIds: string[], apiToken: string): Promise<ApiTaskStatus[]> {
  return request<ApiTaskStatus[]>("/query_result", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...tokenHeaders(apiToken) },
    body: JSON.stringify({ ...(apiToken ? { ai_token: apiToken } : {}), task_id_list: taskIds }),
  });
}

export async function getLibrary(apiToken: string): Promise<ApiLibraryResponse> {
  return request<ApiLibraryResponse>("/v1/library", { headers: tokenHeaders(apiToken) });
}

export async function deleteLibraryItem(itemId: string, apiToken: string): Promise<void> {
  await request<{ id: string; deleted: boolean }>(`/v1/library/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
    headers: tokenHeaders(apiToken),
  });
}

export async function createVisualizer(itemId: string, aspect: VisualizerAspect, apiToken: string): Promise<VisualizerAsset> {
  return request<VisualizerAsset>(`/v1/library/${encodeURIComponent(itemId)}/visualizers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...tokenHeaders(apiToken) },
    body: JSON.stringify({ aspect }),
  });
}

export function parseResult(result: ApiTaskStatus["result"]): AudioResult | undefined {
  if (!result) return undefined;
  try {
    const parsed = typeof result === "string" ? (JSON.parse(result) as AudioResult[]) : result;
    return Array.isArray(parsed) ? parsed[0] : undefined;
  } catch {
    return undefined;
  }
}

export function audioUrl(file: string) {
  if (/^https?:\/\//.test(file)) return file;
  return `${apiBase}${file.startsWith("/") ? file : `/${file}`}`;
}
