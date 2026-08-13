import type { getWorkspaceCopy } from "./workspaceCopy";

export type LocalizedNoticeKey =
  | "generationReview"
  | "trackReady"
  | "saved"
  | "waitingLibrary"
  | "refreshQueue"
  | "queued"
  | "submitFailed"
  | "removed"
  | "removeFailed"
  | "visualizerQueued"
  | "visualizerReady"
  | "visualizerFailed";

export type WorkspaceNotice =
  | { type: "localized"; key: LocalizedNoticeKey; position?: number }
  | { type: "message"; message: string };

export function formatWorkspaceNotice(notice: WorkspaceNotice | undefined, copy: ReturnType<typeof getWorkspaceCopy>) {
  if (!notice) return undefined;
  if (notice.type === "message") return notice.message;
  if (notice.key === "queued") return copy.notice.queued(notice.position);
  return copy.notice[notice.key];
}
