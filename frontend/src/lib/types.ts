export type TaskType = "text2music" | "cover" | "repaint";
export type TaskState = "queued" | "working" | "ready" | "failed";
export type ServiceState = "checking" | "online" | "offline";

export interface GenerationDraft {
  prompt: string;
  lyrics: string;
  taskType: TaskType;
  thinking: boolean;
  useFormat: boolean;
  vocalLanguage: string;
  audioFormat: "mp3" | "wav" | "flac" | "opus";
  model: string;
  bpm: string;
  keyScale: string;
  timeSignature: string;
  duration: string;
  steps: string;
  guidance: string;
  useRandomSeed: boolean;
  seed: string;
  batchSize: string;
  sourceAudio?: File;
  referenceAudio?: File;
}

export interface AudioResult {
  file: string;
  prompt?: string;
  lyrics?: string;
  metas?: {
    bpm?: number;
    duration?: number;
    keyscale?: string;
    timesignature?: string;
    genres?: string;
  };
  seed_value?: string;
  dit_model?: string;
}

export interface GenerationTask {
  id: string;
  prompt: string;
  taskType: TaskType;
  createdAt: number;
  state: TaskState;
  queuePosition?: number;
  result?: AudioResult;
  error?: string;
}

export interface ApiEnvelope<T> {
  data: T;
  code: number;
  error: string | null;
}

export interface ApiHealth {
  status: string;
  service: string;
  version: string;
  models_initialized: boolean;
  llm_initialized: boolean;
  loaded_model: string | null;
  loaded_lm_model: string | null;
}

export interface ApiModelInventory {
  models?: Array<{ name?: string; id?: string }> | string[];
  loaded_model?: string | null;
}

export interface ApiQueuedTask {
  task_id: string;
  status: "queued";
  queue_position?: number;
}

export interface ApiTaskStatus {
  task_id: string;
  status: number;
  result?: string | AudioResult[];
  error?: string;
  message?: string;
}

export interface ApiLibraryItem {
  id: string;
  created_at: number;
  task_type: TaskType;
  state: "ready";
  result: AudioResult;
}

export interface ApiLibraryResponse {
  items: ApiLibraryItem[];
}

export interface WorkspaceSettings {
  apiToken: string;
}

export const defaultDraft: GenerationDraft = {
  prompt: "",
  lyrics: "",
  taskType: "text2music",
  thinking: true,
  useFormat: true,
  vocalLanguage: "en",
  audioFormat: "mp3",
  model: "",
  bpm: "",
  keyScale: "",
  timeSignature: "4",
  duration: "30",
  steps: "8",
  guidance: "7",
  useRandomSeed: true,
  seed: "",
  batchSize: "1",
};
