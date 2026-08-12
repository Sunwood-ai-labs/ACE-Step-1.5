import { Cpu, RefreshCw, ShieldCheck } from "lucide-react";
import type { ApiHealth, ServiceState } from "../lib/types";
import { useLocale } from "../i18n/LocaleProvider";
import { getWorkspaceCopy } from "../i18n/workspaceCopy";

interface ServicePanelProps {
  state: ServiceState;
  health?: ApiHealth;
  onRefresh: () => Promise<void>;
}

export function ServicePanel({ state, health, onRefresh }: ServicePanelProps) {
  const { locale } = useLocale();
  const copy = getWorkspaceCopy(locale).service;
  const summary = copy.summary(state, health?.models_initialized);
  return (
    <section className="service-panel" aria-labelledby="service-heading">
      <div className="panel-topline"><p className="eyebrow">{copy.eyebrow}</p><span className={`state-pill ${state}`}>{copy.state(state)}</span></div>
      <h2 id="service-heading">{summary}</h2>
      <p>{state === "online" ? copy.onlineBody : copy.offlineBody}</p>
      <dl className="service-facts">
        <div><dt><Cpu size={15} aria-hidden="true" /> {copy.model}</dt><dd>{health?.loaded_model ?? copy.serverDefault}</dd></div>
        <div><dt><ShieldCheck size={15} aria-hidden="true" /> {copy.planner}</dt><dd>{health?.llm_initialized ? copy.initialized : copy.onDemand}</dd></div>
      </dl>
      <button className="secondary-button" type="button" onClick={() => void onRefresh()}><RefreshCw size={16} aria-hidden="true" /> {copy.refresh}</button>
    </section>
  );
}
