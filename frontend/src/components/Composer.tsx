import { FileAudio, Sparkles, WandSparkles } from "lucide-react";
import { useState } from "react";
import { GenerationSettings } from "./GenerationSettings";
import { defaultDraft, type GenerationDraft, type ServiceState, type TaskType } from "../lib/types";

interface ComposerProps {
  models: string[];
  isSubmitting: boolean;
  serviceState: ServiceState;
  onSubmit: (draft: GenerationDraft) => Promise<boolean>;
}

const ideas = [
  { label: "Glasshouse", prompt: "warm analog house, glassy chords, midnight city rain, patient bassline", bpm: "118" },
  { label: "Ink wash", prompt: "Japanese ambient folk, koto fragments, field recordings, close intimate vocal", bpm: "82" },
  { label: "Slow signal", prompt: "cinematic post-rock, patient drums, wide guitars, bittersweet final lift", bpm: "96" },
];

export function Composer({ models, isSubmitting, serviceState, onSubmit }: ComposerProps) {
  const [draft, setDraft] = useState<GenerationDraft>(defaultDraft);
  const [validationMessage, setValidationMessage] = useState("");
  const update = <Key extends keyof GenerationDraft>(key: Key, value: GenerationDraft[Key]) => setDraft((current) => ({ ...current, [key]: value }));
  const isEditing = draft.taskType === "cover" || draft.taskType === "repaint";

  const submit = async () => {
    if (!draft.prompt.trim()) return setValidationMessage("Describe the music you want to hear before generating.");
    if (isEditing && !draft.sourceAudio) return setValidationMessage("Cover and repaint modes need a source-audio file.");
    setValidationMessage("");
    await onSubmit(draft);
  };

  const applyIdea = (idea: (typeof ideas)[number]) => {
    setDraft((current) => ({ ...current, prompt: idea.prompt, bpm: idea.bpm, taskType: "text2music" }));
    setValidationMessage("");
  };

  return (
    <form className="composer-card" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <div className="composer-intro">
        <div><p className="eyebrow">New generation</p><h2>Begin with a feeling.</h2></div>
        <div className="mode-tabs" aria-label="Generation mode">
          {(["text2music", "cover", "repaint"] as TaskType[]).map((mode) => (
            <button type="button" key={mode} className={draft.taskType === mode ? "is-selected" : ""} aria-pressed={draft.taskType === mode} onClick={() => update("taskType", mode)}>
              {mode === "text2music" ? "Text" : mode === "cover" ? "Cover" : "Repaint"}
            </button>
          ))}
        </div>
      </div>

      <label className="prompt-field"><span>Sound direction</span><textarea value={draft.prompt} onChange={(event) => update("prompt", event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void submit(); }} placeholder="Describe rhythm, texture, era, instrument, room, and emotional arc…" rows={4} aria-describedby="prompt-help" required /><small id="prompt-help">Specific sensory details tend to create more deliberate arrangements.</small></label>
      <div className="idea-row" aria-label="Use a writing prompt"><span>Try a direction</span>{ideas.map((idea) => <button type="button" key={idea.label} onClick={() => applyIdea(idea)}>{idea.label}</button>)}</div>

      <label className="lyrics-field"><span>Lyrics <em>optional</em></span><textarea value={draft.lyrics} onChange={(event) => update("lyrics", event.target.value)} placeholder="Verse, chorus, or a few vocal cues…" rows={3} /></label>

      <div className="assist-row">
        <label className="check-row"><input type="checkbox" checked={draft.thinking} onChange={(event) => update("thinking", event.target.checked)} /><span>Use 5Hz planning</span><small>more considered structure</small></label>
        <label className="check-row"><input type="checkbox" checked={draft.useFormat} onChange={(event) => update("useFormat", event.target.checked)} /><span>Format input</span><small>refine prompt &amp; lyrics</small></label>
      </div>

      {(isEditing || draft.taskType === "text2music") && (
        <div className="upload-grid">
          {isEditing && <label className="file-field required"><FileAudio size={18} aria-hidden="true" /><span><strong>Source audio</strong><small>Required for {draft.taskType}</small></span><input type="file" accept="audio/*" onChange={(event) => update("sourceAudio", event.target.files?.[0])} /><em>{draft.sourceAudio?.name ?? "Choose audio"}</em></label>}
          <label className="file-field"><FileAudio size={18} aria-hidden="true" /><span><strong>Reference audio</strong><small>Optional style signal</small></span><input type="file" accept="audio/*" onChange={(event) => update("referenceAudio", event.target.files?.[0])} /><em>{draft.referenceAudio?.name ?? "Choose audio"}</em></label>
        </div>
      )}

      <GenerationSettings draft={draft} models={models} onUpdate={update} />
      {validationMessage && <p className="form-error" role="alert">{validationMessage}</p>}
      {serviceState === "offline" && <p className="form-error" role="status">The local API is unreachable. Start the Compose stack, then try again.</p>}
      <div className="composer-actions">
        <p><WandSparkles size={16} aria-hidden="true" /> Files stay inside the local ACE-Step service.</p>
        <button className="primary-button" type="submit" disabled={isSubmitting || serviceState !== "online"}>
          <Sparkles size={18} aria-hidden="true" />
          <span>{isSubmitting ? "Adding to queue…" : "Generate audio"}</span>
          <kbd>⌘ ↵</kbd>
        </button>
      </div>
    </form>
  );
}
