import { LoaderCircle, Trash2, TriangleAlert, Waves } from "lucide-react";
import { AudioPreview } from "./AudioPreview";
import type { GenerationTask } from "../lib/types";

interface TaskQueueProps {
  tasks: GenerationTask[];
  onRemove: (taskId: string) => void;
  apiToken: string;
  compact?: boolean;
}

function stateLabel(task: GenerationTask) {
  if (task.state === "ready") return "Ready";
  if (task.state === "failed") return "Needs review";
  if (task.state === "working") return "Rendering";
  return task.queuePosition ? `Queued · #${task.queuePosition}` : "Queued";
}

function createdAt(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(timestamp);
}

export function TaskQueue({ tasks, onRemove, apiToken, compact = false }: TaskQueueProps) {
  if (tasks.length === 0) {
    return (
      <section className="empty-queue" aria-label="No generation jobs">
        <Waves size={24} strokeWidth={1.4} aria-hidden="true" />
        <div><strong>No jobs yet.</strong><p>Finished audio will appear here for every Forge device.</p></div>
      </section>
    );
  }

  return (
    <div className={`task-list${compact ? " compact" : ""}`} aria-live="polite">
      {tasks.map((task) => (
        <article className={`task-card ${task.state}`} key={task.id}>
          <div className="task-status" aria-hidden="true">
            {task.state === "working" || task.state === "queued" ? <LoaderCircle size={17} /> : task.state === "failed" ? <TriangleAlert size={17} /> : <Waves size={17} />}
          </div>
          <div className="task-copy">
            <div className="task-title-row">
              <p className="task-title">{task.prompt || "Untitled generation"}</p>
              <span className="task-state">{stateLabel(task)}</span>
            </div>
            <p className="task-meta">{task.taskType.replace("text2music", "text to music")} · {createdAt(task.createdAt)}</p>
            {task.error && <p className="task-error">{task.error}</p>}
            {task.result?.file && <AudioPreview file={task.result.file} apiToken={apiToken} />}
          </div>
          <button className="icon-button subtle" type="button" onClick={() => void onRemove(task.id)} title="Remove from shared library" aria-label="Remove from shared library">
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </article>
      ))}
    </div>
  );
}
