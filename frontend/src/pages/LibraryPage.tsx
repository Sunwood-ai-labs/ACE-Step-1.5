import { ArchiveRestore, Music2, Radio } from "lucide-react";
import { TaskQueue } from "../components/TaskQueue";
import { useLocale } from "../i18n/LocaleProvider";
import { getWorkspaceCopy } from "../i18n/workspaceCopy";
import type { Workspace } from "../lib/useWorkspace";

interface LibraryPageProps {
  workspace: Workspace;
}

export function LibraryPage({ workspace }: LibraryPageProps) {
  const { locale } = useLocale();
  const copy = getWorkspaceCopy(locale);
  const ready = workspace.tasks.filter((task) => task.state === "ready");
  const other = workspace.tasks.filter((task) => task.state !== "ready");
  return (
    <div className="page-stack library-page">
      {workspace.notice && <div className="notice-banner" role="status"><Radio size={17} aria-hidden="true" />{workspace.notice}</div>}
      <section className="library-hero">
        <div><p className="eyebrow">{copy.library.eyebrow}</p><h2>{copy.library.title}</h2><p>{copy.library.body}</p></div>
        <div className="library-count"><Music2 size={24} aria-hidden="true" /><strong>{ready.length}</strong><span>{copy.library.readyCount}</span></div>
      </section>
      <section className="queue-section" aria-labelledby="ready-heading">
        <div className="section-heading"><div><p className="eyebrow">{copy.library.finished}</p><h2 id="ready-heading">{copy.library.collect}</h2></div><ArchiveRestore size={22} aria-hidden="true" /></div>
        <TaskQueue tasks={ready} onRemove={workspace.removeTask} apiToken={workspace.settings.apiToken} onCreateVisualizer={workspace.createVisualizer} />
      </section>
      {other.length > 0 && <section className="queue-section quiet-queue" aria-labelledby="elsewhere-heading"><div className="section-heading"><div><p className="eyebrow">{copy.library.elsewhere}</p><h2 id="elsewhere-heading">{copy.library.inProgress}</h2></div></div><TaskQueue tasks={other} onRemove={workspace.removeTask} apiToken={workspace.settings.apiToken} compact /></section>}
    </div>
  );
}
