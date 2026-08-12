import { FileAudio, Sparkles, WandSparkles } from "lucide-react";
import { useState } from "react";
import { GenerationSettings } from "./GenerationSettings";
import { useLocale } from "../i18n/LocaleProvider";
import { getComposerCopy } from "../i18n/composerCopy";
import { defaultDraft, type GenerationDraft, type ServiceState, type TaskType } from "../lib/types";

interface ComposerProps {
  models: string[];
  isSubmitting: boolean;
  serviceState: ServiceState;
  onSubmit: (draft: GenerationDraft) => Promise<boolean>;
}

type ValidationIssue = "prompt" | "source";

export function Composer({ models, isSubmitting, serviceState, onSubmit }: ComposerProps) {
  const { locale } = useLocale();
  const copy = getComposerCopy(locale);
  const [draft, setDraft] = useState<GenerationDraft>(defaultDraft);
  const [validationIssue, setValidationIssue] = useState<ValidationIssue>();
  const update = <Key extends keyof GenerationDraft>(key: Key, value: GenerationDraft[Key]) => setDraft((current) => ({ ...current, [key]: value }));
  const isEditing = draft.taskType === "cover" || draft.taskType === "repaint";
  const validationMessage = validationIssue ? copy.validation[validationIssue] : "";

  const submit = async () => {
    if (!draft.prompt.trim()) return setValidationIssue("prompt");
    if (isEditing && !draft.sourceAudio) return setValidationIssue("source");
    setValidationIssue(undefined);
    await onSubmit(draft);
  };

  const applyIdea = (idea: (typeof copy.ideas)[number]) => {
    setDraft((current) => ({ ...current, prompt: idea.prompt, bpm: idea.bpm, taskType: "text2music" }));
    setValidationIssue(undefined);
  };

  return (
    <form className="composer-card" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <div className="composer-intro">
        <div><p className="eyebrow">{copy.eyebrow}</p><h2>{copy.title}</h2></div>
        <div className="mode-tabs" aria-label={copy.modeLabel}>
          {(["text2music", "cover", "repaint"] as TaskType[]).map((mode) => (
            <button type="button" key={mode} className={draft.taskType === mode ? "is-selected" : ""} aria-pressed={draft.taskType === mode} onClick={() => update("taskType", mode)}>
              {copy.modes[mode]}
            </button>
          ))}
        </div>
      </div>

      <label className="prompt-field"><span>{copy.soundDirection}</span><textarea value={draft.prompt} onChange={(event) => update("prompt", event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void submit(); }} placeholder={copy.promptPlaceholder} rows={4} aria-describedby="prompt-help" required /><small id="prompt-help">{copy.promptHelp}</small></label>
      <div className="idea-row" aria-label={copy.tryDirection}><span>{copy.tryDirection}</span>{copy.ideas.map((idea) => <button type="button" key={idea.label} onClick={() => applyIdea(idea)}>{idea.label}</button>)}</div>

      <label className="lyrics-field"><span>{copy.lyrics} <em>{copy.optional}</em></span><textarea value={draft.lyrics} onChange={(event) => update("lyrics", event.target.value)} placeholder={copy.lyricsPlaceholder} rows={3} /></label>

      <div className="assist-row">
        <label className="check-row"><input type="checkbox" checked={draft.thinking} onChange={(event) => update("thinking", event.target.checked)} /><span>{copy.planning}</span><small>{copy.planningHint}</small></label>
        <label className="check-row"><input type="checkbox" checked={draft.useFormat} onChange={(event) => update("useFormat", event.target.checked)} /><span>{copy.format}</span><small>{copy.formatHint}</small></label>
      </div>

      {(isEditing || draft.taskType === "text2music") && (
        <div className="upload-grid">
          {isEditing && <label className="file-field required"><FileAudio size={18} aria-hidden="true" /><span><strong>{copy.sourceAudio}</strong><small>{copy.sourceRequired(draft.taskType)}</small></span><input type="file" accept="audio/*" onChange={(event) => update("sourceAudio", event.target.files?.[0])} /><em>{draft.sourceAudio?.name ?? copy.chooseAudio}</em></label>}
          <label className="file-field"><FileAudio size={18} aria-hidden="true" /><span><strong>{copy.referenceAudio}</strong><small>{copy.referenceHint}</small></span><input type="file" accept="audio/*" onChange={(event) => update("referenceAudio", event.target.files?.[0])} /><em>{draft.referenceAudio?.name ?? copy.chooseAudio}</em></label>
        </div>
      )}

      <GenerationSettings draft={draft} models={models} onUpdate={update} />
      {validationMessage && <p className="form-error" role="alert">{validationMessage}</p>}
      {serviceState === "offline" && <p className="form-error" role="status">{copy.validation.offline}</p>}
      <div className="composer-actions">
        <p><WandSparkles size={16} aria-hidden="true" /> {copy.filesStayLocal}</p>
        <button className="primary-button" type="submit" disabled={isSubmitting || serviceState !== "online"}>
          <Sparkles size={18} aria-hidden="true" />
          <span>{isSubmitting ? copy.addingQueue : copy.generate}</span>
          <kbd>⌘ ↵</kbd>
        </button>
      </div>
    </form>
  );
}
