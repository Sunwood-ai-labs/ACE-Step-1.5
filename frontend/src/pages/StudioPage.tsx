import { ListMusic, Radio } from "lucide-react";
import { Composer } from "../components/Composer";
import { MetricStrip } from "../components/MetricStrip";
import { ServicePanel } from "../components/ServicePanel";
import { TaskQueue } from "../components/TaskQueue";
import type { Workspace } from "../lib/useWorkspace";

interface StudioPageProps {
  workspace: Workspace;
}

export function StudioPage({ workspace }: StudioPageProps) {
  const { tasks, metrics, notice, ...controls } = workspace;
  return (
    <div className="page-stack">
      {notice && <div className="notice-banner" role="status"><Radio size={17} aria-hidden="true" />{notice}</div>}
      <MetricStrip {...metrics} />
      <div className="studio-grid">
        <Composer models={controls.models} isSubmitting={controls.isSubmitting} serviceState={controls.serviceState} onSubmit={controls.submit} />
        <aside className="inspector-column" aria-label="Generation service details">
          <ServicePanel state={controls.serviceState} health={controls.health} onRefresh={controls.refreshService} />
          <section className="field-note">
            <p className="eyebrow">Working note</p>
            <h2>Give the engine a scene, not a genre tag.</h2>
            <p>Describe material, room, movement, and the point of emotional change. Then add only the tempo or key you truly need.</p>
          </section>
        </aside>
      </div>
      <section className="queue-section" aria-labelledby="queue-heading">
        <div className="section-heading"><div><p className="eyebrow">Render queue</p><h2 id="queue-heading">What is taking shape</h2></div><ListMusic size={22} aria-hidden="true" /></div>
        <TaskQueue tasks={tasks.slice(0, 8)} onRemove={controls.removeTask} apiToken={controls.settings.apiToken} />
      </section>
    </div>
  );
}
