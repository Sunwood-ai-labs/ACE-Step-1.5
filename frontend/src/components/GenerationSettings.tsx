import { ChevronDown, Dice5 } from "lucide-react";
import type { GenerationDraft } from "../lib/types";

type UpdateDraft = <Key extends keyof GenerationDraft>(key: Key, value: GenerationDraft[Key]) => void;

interface GenerationSettingsProps {
  draft: GenerationDraft;
  models: string[];
  onUpdate: UpdateDraft;
}

export function GenerationSettings({ draft, models, onUpdate }: GenerationSettingsProps) {
  return (
    <section className="generation-settings" aria-labelledby="settings-heading">
      <div className="section-heading">
        <div><p className="eyebrow">Sound parameters</p><h2 id="settings-heading">Shape the take</h2></div>
        <span className="quiet-label">Optional precision</span>
      </div>

      <div className="form-grid three-up">
        <label><span>Language</span><select value={draft.vocalLanguage} onChange={(event) => onUpdate("vocalLanguage", event.target.value)}><option value="en">English</option><option value="ja">Japanese</option><option value="zh">Chinese</option><option value="ko">Korean</option><option value="es">Spanish</option><option value="fr">French</option></select></label>
        <label><span>Output</span><select value={draft.audioFormat} onChange={(event) => onUpdate("audioFormat", event.target.value as GenerationDraft["audioFormat"])}><option value="mp3">MP3</option><option value="wav">WAV</option><option value="flac">FLAC</option><option value="opus">Opus</option></select></label>
        <label><span>Model</span><select value={draft.model} onChange={(event) => onUpdate("model", event.target.value)}><option value="">Server default</option>{models.map((model) => <option value={model} key={model}>{model}</option>)}</select></label>
        <label><span>Tempo</span><div className="unit-input"><input value={draft.bpm} onChange={(event) => onUpdate("bpm", event.target.value)} inputMode="numeric" min="30" max="300" placeholder="Auto" /><em>BPM</em></div></label>
        <label><span>Key / scale</span><input value={draft.keyScale} onChange={(event) => onUpdate("keyScale", event.target.value)} placeholder="Auto" /></label>
        <label><span>Meter</span><select value={draft.timeSignature} onChange={(event) => onUpdate("timeSignature", event.target.value)}><option value="">Auto</option><option value="2">2 / 4</option><option value="3">3 / 4</option><option value="4">4 / 4</option><option value="6">6 / 8</option></select></label>
      </div>

      <details className="advanced-settings">
        <summary><span>Advanced controls</span><ChevronDown size={17} aria-hidden="true" /></summary>
        <div className="form-grid four-up advanced-grid">
          <label><span>Duration</span><div className="unit-input"><input value={draft.duration} onChange={(event) => onUpdate("duration", event.target.value)} inputMode="decimal" min="10" max="600" /><em>sec</em></div></label>
          <label><span>Steps</span><input value={draft.steps} onChange={(event) => onUpdate("steps", event.target.value)} inputMode="numeric" min="1" max="200" /></label>
          <label><span>Guidance</span><input value={draft.guidance} onChange={(event) => onUpdate("guidance", event.target.value)} inputMode="decimal" min="1" max="20" /></label>
          <label><span>Batch</span><input value={draft.batchSize} onChange={(event) => onUpdate("batchSize", event.target.value)} inputMode="numeric" min="1" max="8" /></label>
        </div>
        <label className="check-row seed-row"><input type="checkbox" checked={draft.useRandomSeed} onChange={(event) => onUpdate("useRandomSeed", event.target.checked)} /><span>Random seed</span><Dice5 size={16} aria-hidden="true" /></label>
        {!draft.useRandomSeed && <label className="seed-input"><span>Seed</span><input value={draft.seed} onChange={(event) => onUpdate("seed", event.target.value)} inputMode="numeric" placeholder="e.g. 41729" /></label>}
      </details>
    </section>
  );
}
