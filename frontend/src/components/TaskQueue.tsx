import { LoaderCircle, Trash2, TriangleAlert, Waves } from "lucide-react";
import { AudioPreview } from "./AudioPreview";
import { VisualizerPanel } from "./VisualizerPanel";
import { useLocale } from "../i18n/LocaleProvider";
import { getWorkspaceCopy } from "../i18n/workspaceCopy";
import type { GenerationTask, VisualizerAspect } from "../lib/types";

interface TaskQueueProps {
  tasks: GenerationTask[];
  onRemove: (taskId: string) => void;
  apiToken: string;
  compact?: boolean;
  onCreateVisualizer?: (taskId: string, aspect: VisualizerAspect) => Promise<boolean>;
}

export function TaskQueue({ tasks, onRemove, apiToken, compact = false, onCreateVisualizer }: TaskQueueProps) {
  const { locale } = useLocale();
  const copy = getWorkspaceCopy(locale).task;
  if (tasks.length === 0) {
    return (
      <section className="empty-queue" aria-label={copy.emptyLabel}>
        <Waves size={24} strokeWidth={1.4} aria-hidden="true" />
        <div><strong>{copy.emptyTitle}</strong><p>{copy.emptyBody}</p></div>
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
              <p className="task-title">{task.prompt || copy.untitled}</p>
              <span className="task-state">{copy.state(task.state, task.queuePosition)}</span>
            </div>
            <p className="task-meta">{copy.taskType[task.taskType]} · {new Intl.DateTimeFormat(copy.timeLocale, { hour: "2-digit", minute: "2-digit" }).format(task.createdAt)}</p>
            {task.error && <p className="task-error">{task.error}</p>}
            {task.result?.file && <AudioPreview file={task.result.file} apiToken={apiToken} />}
            {!compact && task.state === "ready" && task.result?.file && onCreateVisualizer && <VisualizerPanel visualizers={task.visualizers ?? []} apiToken={apiToken} onCreate={(aspect) => onCreateVisualizer(task.id, aspect)} />}
          </div>
          <button className="icon-button subtle" type="button" onClick={() => void onRemove(task.id)} title={copy.remove} aria-label={copy.remove}>
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </article>
      ))}
    </div>
  );
}
