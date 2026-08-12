import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "../i18n/LocaleProvider";
import { formatWorkspaceNotice, type WorkspaceNotice } from "../i18n/workspaceNotice";
import { getWorkspaceCopy } from "../i18n/workspaceCopy";
import { ApiError, deleteLibraryItem, getHealth, getLibrary, getModels, queryTasks, submitTask } from "./api";
import { readSettings, readTasks, writeSettings, writeTasks } from "./storage";
import { activeTasks, mergeSharedLibrary, taskFromLibrary } from "./workspaceTasks";
import type { ApiHealth, GenerationDraft, GenerationTask, ServiceState, WorkspaceSettings } from "./types";
export function useWorkspace() {
  const { locale } = useLocale();
  const copy = useMemo(() => getWorkspaceCopy(locale), [locale]);
  const [tasks, setTasks] = useState<GenerationTask[]>(readTasks);
  const taskRef = useRef(tasks);
  const previousTaskStates = useRef(new Map(tasks.map((task) => [task.id, task.state])));
  const [settings, setSettings] = useState<WorkspaceSettings>(readSettings);
  const [serviceState, setServiceState] = useState<ServiceState>("checking");
  const [health, setHealth] = useState<ApiHealth>();
  const [models, setModels] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noticeState, setNoticeState] = useState<WorkspaceNotice>();

  useEffect(() => {
    taskRef.current = tasks;
    writeTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    const earlierStates = previousTaskStates.current;
    const failedTask = tasks.find((task) => task.state === "failed" && earlierStates.get(task.id) !== "failed");
    const readyTask = tasks.find((task) => task.state === "ready" && earlierStates.get(task.id) !== "ready");

    if (failedTask) {
      setNoticeState(failedTask.error ? { type: "message", message: failedTask.error } : { type: "localized", key: "generationReview" });
    } else if (readyTask) {
      setNoticeState({ type: "localized", key: "trackReady" });
    }

    previousTaskStates.current = new Map(tasks.map((task) => [task.id, task.state]));
  }, [copy, tasks]);
  useEffect(() => writeSettings(settings), [settings]);

  const refreshService = useCallback(async () => {
    setServiceState("checking");
    try {
      const currentHealth = await getHealth();
      setHealth(currentHealth);
      setServiceState("online");
      const nextModels = await getModels(settings.apiToken).catch(() => []);
      setModels(nextModels);
    } catch {
      setServiceState("offline");
    }
  }, [settings.apiToken]);

  const refreshLibrary = useCallback(async () => {
    try {
      const response = await getLibrary(settings.apiToken);
      const shared = response.items.map(taskFromLibrary);
      setTasks((current) => mergeSharedLibrary(current, shared));
      return true;
    } catch {
      // The health panel reports service reachability; retain active local jobs until it returns.
      return false;
    }
  }, [settings.apiToken]);

  const pollTasks = useCallback(async () => {
    const active = activeTasks(taskRef.current);
    if (active.length === 0) return;
    try {
      const updates = await queryTasks(active.map((task) => task.id), settings.apiToken);
      const succeededTaskIds = new Set(updates.filter((item) => item.status === 1).map((item) => item.task_id));
      setTasks((current) => {
        let changed = false;
        const next: GenerationTask[] = current.map((task): GenerationTask => {
          const update = updates.find((item) => item.task_id === task.id);
          if (!update) return task;
          // A job becomes visible as Ready only when the API's shared Library
          // returns it. This avoids presenting browser-local success when the
          // server has not confirmed durable audio storage yet.
          if (update.status === 1) return task;
          if (update.status === 2 && task.state !== "failed") {
            changed = true;
            return { ...task, state: "failed", error: update.error ?? update.message ?? copy.notice.generationReview };
          }
          if (update.status === 0 && task.state !== "working") {
            changed = true;
            return { ...task, state: "working" };
          }
          return task;
        });
        return changed ? next : current;
      });
      if (succeededTaskIds.size > 0) {
        const libraryConfirmed = await refreshLibrary();
        if (libraryConfirmed) {
          setTasks((current) => current.filter((task) => !succeededTaskIds.has(task.id)));
          setNoticeState({ type: "localized", key: "saved" });
        } else {
          setNoticeState({ type: "localized", key: "waitingLibrary" });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.notice.refreshQueue;
      setNoticeState(error instanceof Error ? { type: "message", message } : { type: "localized", key: "refreshQueue" });
    }
  }, [copy, refreshLibrary, settings.apiToken]);

  useEffect(() => {
    void refreshService();
    const timer = window.setInterval(() => void refreshService(), 30_000);
    return () => window.clearInterval(timer);
  }, [refreshService]);

  useEffect(() => {
    void refreshLibrary();
    const timer = window.setInterval(() => void refreshLibrary(), 12_000);
    return () => window.clearInterval(timer);
  }, [refreshLibrary]);

  useEffect(() => {
    if (activeTasks(tasks).length === 0) return;
    void pollTasks();
    const timer = window.setInterval(() => void pollTasks(), 4_000);
    return () => window.clearInterval(timer);
  }, [pollTasks, tasks]);

  const submit = useCallback(
    async (draft: GenerationDraft) => {
      setIsSubmitting(true);
      setNoticeState(undefined);
      try {
        const queued = await submitTask(draft, settings.apiToken);
        const newTask: GenerationTask = {
          id: queued.task_id,
          prompt: draft.prompt,
          taskType: draft.taskType,
          createdAt: Date.now(),
          state: "queued",
          queuePosition: queued.queue_position,
        };
        setTasks((current) => [newTask, ...current]);
        setNoticeState({ type: "localized", key: "queued", position: queued.queue_position });
        return true;
      } catch (error) {
        const message = error instanceof ApiError ? error.message : copy.notice.submitFailed;
        setNoticeState(error instanceof ApiError ? { type: "message", message } : { type: "localized", key: "submitFailed" });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [copy, settings.apiToken],
  );

  const removeTask = useCallback(async (taskId: string) => {
    const task = taskRef.current.find((item) => item.id === taskId);
    if (task?.state !== "ready") {
      setTasks((current) => current.filter((item) => item.id !== taskId));
      return;
    }

    try {
      await deleteLibraryItem(taskId, settings.apiToken);
      setTasks((current) => current.filter((item) => item.id !== taskId));
      setNoticeState({ type: "localized", key: "removed" });
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.notice.removeFailed;
      setNoticeState(error instanceof Error ? { type: "message", message } : { type: "localized", key: "removeFailed" });
    }
  }, [copy, settings.apiToken]);

  const metrics = useMemo(
    () => ({
      active: activeTasks(tasks).length,
      ready: tasks.filter((task) => task.state === "ready").length,
      failed: tasks.filter((task) => task.state === "failed").length,
    }),
    [tasks],
  );

  return {
    tasks,
    settings,
    setSettings,
    serviceState,
    health,
    models,
    isSubmitting,
    notice: formatWorkspaceNotice(noticeState, copy),
    metrics,
    refreshService,
    refreshLibrary,
    pollTasks,
    submit,
    removeTask,
  };
}

export type Workspace = ReturnType<typeof useWorkspace>;
