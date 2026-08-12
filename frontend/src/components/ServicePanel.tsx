import { Cpu, RefreshCw, ShieldCheck } from "lucide-react";
import type { ApiHealth, ServiceState } from "../lib/types";

interface ServicePanelProps {
  state: ServiceState;
  health?: ApiHealth;
  onRefresh: () => Promise<void>;
}

export function ServicePanel({ state, health, onRefresh }: ServicePanelProps) {
  const summary = state === "online" ? (health?.models_initialized ? "Models initialized" : "API is reachable") : state === "checking" ? "Checking local service" : "Service unavailable";
  return (
    <section className="service-panel" aria-labelledby="service-heading">
      <div className="panel-topline"><p className="eyebrow">Local service</p><span className={`state-pill ${state}`}>{state}</span></div>
      <h2 id="service-heading">{summary}</h2>
      <p>{state === "online" ? "Generation stays on the ACE-Step container behind this workspace." : "The interface remains safe to explore; generation is disabled until the API responds."}</p>
      <dl className="service-facts">
        <div><dt><Cpu size={15} aria-hidden="true" /> DiT model</dt><dd>{health?.loaded_model ?? "Server default"}</dd></div>
        <div><dt><ShieldCheck size={15} aria-hidden="true" /> 5Hz planner</dt><dd>{health?.llm_initialized ? "Initialized" : "On demand"}</dd></div>
      </dl>
      <button className="secondary-button" type="button" onClick={() => void onRefresh()}><RefreshCw size={16} aria-hidden="true" /> Refresh status</button>
    </section>
  );
}
