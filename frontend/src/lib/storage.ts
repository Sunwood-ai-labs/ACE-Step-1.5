import type { GenerationTask, WorkspaceSettings } from "./types";

const taskKey = "ace-step-studio.tasks";
const settingsKey = "ace-step-studio.settings";

function read<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function readTasks() {
  return read<GenerationTask[]>(taskKey, []);
}

export function writeTasks(tasks: GenerationTask[]) {
  window.localStorage.setItem(taskKey, JSON.stringify(tasks.slice(0, 60)));
}

export function readSettings() {
  return read<WorkspaceSettings>(settingsKey, { apiToken: "" });
}

export function writeSettings(settings: WorkspaceSettings) {
  window.localStorage.setItem(settingsKey, JSON.stringify(settings));
}
