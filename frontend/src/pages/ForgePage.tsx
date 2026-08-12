import { ListMusic, Radio } from "lucide-react";
import { Composer } from "../components/Composer";
import { MetricStrip } from "../components/MetricStrip";
import { ServicePanel } from "../components/ServicePanel";
import { TaskQueue } from "../components/TaskQueue";
import { useLocale } from "../i18n/LocaleProvider";
import { getWorkspaceCopy } from "../i18n/workspaceCopy";
import type { Workspace } from "../lib/useWorkspace";

interface ForgePageProps {
  workspace: Workspace;
}

export function ForgePage({ workspace }: ForgePageProps) {
  const { locale } = useLocale();
  const copy = getWorkspaceCopy(locale);
  const { tasks, metrics, notice, ...controls } = workspace;
  return (
    <div className="page-stack">
      {notice && <div className="notice-banner" role="status"><Radio size={17} aria-hidden="true" />{notice}</div>}
      <MetricStrip {...metrics} />
      <div className="forge-grid">
        <Composer models={controls.models} isSubmitting={controls.isSubmitting} serviceState={controls.serviceState} onSubmit={controls.submit} />
        <aside className="inspector-column" aria-label={copy.forge.inspectorLabel}>
          <ServicePanel state={controls.serviceState} health={controls.health} onRefresh={controls.refreshService} />
          <section className="field-note">
            <p className="eyebrow">{copy.forge.noteLabel}</p>
            <h2>{copy.forge.noteTitle}</h2>
            <p>{copy.forge.noteBody}</p>
          </section>
        </aside>
      </div>
      <section className="queue-section" aria-labelledby="queue-heading">
        <div className="section-heading"><div><p className="eyebrow">{copy.forge.queueLabel}</p><h2 id="queue-heading">{copy.forge.queueTitle}</h2></div><ListMusic size={22} aria-hidden="true" /></div>
        <TaskQueue tasks={tasks.slice(0, 8)} onRemove={controls.removeTask} apiToken={controls.settings.apiToken} />
      </section>
    </div>
  );
}
