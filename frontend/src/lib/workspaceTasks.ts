import type { ApiLibraryItem, GenerationTask, VisualizerAsset } from "./types";

export function activeTasks(tasks: GenerationTask[]) {
  return tasks.filter((task) => task.state === "queued" || task.state === "working");
}

export function taskFromLibrary(item: ApiLibraryItem): GenerationTask {
  return {
    id: item.id,
    prompt: item.result.prompt ?? "",
    taskType: item.task_type,
    createdAt: item.created_at,
    state: "ready",
    result: item.result,
    visualizers: item.visualizers ?? [],
  };
}

export function mergeSharedLibrary(current: GenerationTask[], shared: GenerationTask[]) {
  const activeOrFailed = current.filter((task) => task.state !== "ready");
  return [...shared, ...activeOrFailed].sort((left, right) => right.createdAt - left.createdAt);
}

export function mergeVisualizer(task: GenerationTask, visualizer: VisualizerAsset): GenerationTask {
  const existing = task.visualizers ?? [];
  return { ...task, visualizers: [...existing.filter((item) => item.aspect !== visualizer.aspect), visualizer] };
}
