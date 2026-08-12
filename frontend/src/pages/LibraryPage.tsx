import { ArchiveRestore, Music2 } from "lucide-react";
import { TaskQueue } from "../components/TaskQueue";
import type { Workspace } from "../lib/useWorkspace";

interface LibraryPageProps {
  workspace: Workspace;
}

export function LibraryPage({ workspace }: LibraryPageProps) {
  const ready = workspace.tasks.filter((task) => task.state === "ready");
  const other = workspace.tasks.filter((task) => task.state !== "ready");
  return (
    <div className="page-stack library-page">
      <section className="library-hero">
        <div><p className="eyebrow">Local collection</p><h2>Your finished takes, close at hand.</h2><p>Audio is served from ACE-Step; this workspace only remembers the job metadata in your browser.</p></div>
        <div className="library-count"><Music2 size={24} aria-hidden="true" /><strong>{ready.length}</strong><span>ready to audition</span></div>
      </section>
      <section className="queue-section" aria-labelledby="ready-heading">
        <div className="section-heading"><div><p className="eyebrow">Finished</p><h2 id="ready-heading">Audition &amp; collect</h2></div><ArchiveRestore size={22} aria-hidden="true" /></div>
        <TaskQueue tasks={ready} onRemove={workspace.removeTask} apiToken={workspace.settings.apiToken} />
      </section>
      {other.length > 0 && <section className="queue-section quiet-queue" aria-labelledby="elsewhere-heading"><div className="section-heading"><div><p className="eyebrow">Elsewhere</p><h2 id="elsewhere-heading">Still in progress</h2></div></div><TaskQueue tasks={other} onRemove={workspace.removeTask} apiToken={workspace.settings.apiToken} compact /></section>}
    </div>
  );
}
