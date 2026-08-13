import { Clapperboard, LoaderCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocale } from "../i18n/LocaleProvider";
import { getWorkspaceCopy } from "../i18n/workspaceCopy";
import type { VisualizerAspect, VisualizerAsset } from "../lib/types";
import { VideoPreview } from "./VideoPreview";

interface VisualizerPanelProps {
  visualizers: VisualizerAsset[];
  apiToken: string;
  onCreate: (aspect: VisualizerAspect) => Promise<boolean>;
}

export function VisualizerPanel({ visualizers, apiToken, onCreate }: VisualizerPanelProps) {
  const { locale } = useLocale();
  const copy = getWorkspaceCopy(locale).task.visualizer;
  const [aspect, setAspect] = useState<VisualizerAspect>("portrait");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selected = visualizers.find((item) => item.aspect === aspect);
  const isRendering = selected?.state === "rendering";

  async function create() {
    setIsSubmitting(true);
    await onCreate(aspect);
    setIsSubmitting(false);
  }

  return (
    <section className="visualizer-panel" aria-label={copy.title} data-aspect={aspect}>
      <div className="visualizer-heading">
        <div><p className="eyebrow">{copy.eyebrow}</p><h3>{copy.title}</h3><p>{copy.body}</p></div>
        <span className="visualizer-mark" aria-hidden="true"><Sparkles size={20} /></span>
      </div>
      <div className="visualizer-actions">
        <label><span>{copy.format}</span><select value={aspect} onChange={(event) => setAspect(event.target.value as VisualizerAspect)} disabled={isRendering || isSubmitting}><option value="landscape">{copy.landscape}</option><option value="portrait">{copy.portrait}</option></select></label>
        {!selected || selected.state === "failed" ? <button className="secondary-button" type="button" onClick={() => void create()} disabled={isSubmitting}>{isSubmitting ? <LoaderCircle size={16} aria-hidden="true" /> : <Clapperboard size={16} aria-hidden="true" />}{selected?.state === "failed" ? copy.retry : copy.create}</button> : null}
      </div>
      {isRendering && <p className="visualizer-status" role="status" aria-live="polite"><LoaderCircle size={15} aria-hidden="true" /><span><strong>{copy.rendering}</strong>{copy.renderingBody}</span></p>}
      {selected?.state === "failed" && <p className="task-error" role="status" aria-live="polite">{selected.error}</p>}
      {selected?.state === "ready" && selected.file && <div className="visualizer-ready"><p className="visualizer-ready-label">{copy.ready}</p><VideoPreview file={selected.file} apiToken={apiToken} /></div>}
    </section>
  );
}
