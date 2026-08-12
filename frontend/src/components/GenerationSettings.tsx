import { ChevronDown, Dice5 } from "lucide-react";
import { useLocale } from "../i18n/LocaleProvider";
import { getComposerCopy } from "../i18n/composerCopy";
import type { GenerationDraft } from "../lib/types";

type UpdateDraft = <Key extends keyof GenerationDraft>(key: Key, value: GenerationDraft[Key]) => void;

interface GenerationSettingsProps {
  draft: GenerationDraft;
  models: string[];
  onUpdate: UpdateDraft;
}

export function GenerationSettings({ draft, models, onUpdate }: GenerationSettingsProps) {
  const { locale } = useLocale();
  const copy = getComposerCopy(locale).settings;
  return (
    <section className="generation-settings" aria-labelledby="settings-heading">
      <div className="section-heading">
        <div><p className="eyebrow">{copy.eyebrow}</p><h2 id="settings-heading">{copy.title}</h2></div>
        <span className="quiet-label">{copy.precision}</span>
      </div>

      <div className="form-grid three-up">
        <label><span>{copy.vocalLanguage}</span><select value={draft.vocalLanguage} onChange={(event) => onUpdate("vocalLanguage", event.target.value)}><option value="en">{copy.languageOptions.en}</option><option value="ja">{copy.languageOptions.ja}</option><option value="zh">{copy.languageOptions.zh}</option><option value="ko">{copy.languageOptions.ko}</option><option value="es">{copy.languageOptions.es}</option><option value="fr">{copy.languageOptions.fr}</option></select></label>
        <label><span>{copy.output}</span><select value={draft.audioFormat} onChange={(event) => onUpdate("audioFormat", event.target.value as GenerationDraft["audioFormat"])}><option value="mp3">MP3</option><option value="wav">WAV</option><option value="flac">FLAC</option><option value="opus">Opus</option></select></label>
        <label><span>{copy.model}</span><select value={draft.model} onChange={(event) => onUpdate("model", event.target.value)}><option value="">{copy.serverDefault}</option>{models.map((model) => <option value={model} key={model}>{model}</option>)}</select></label>
        <label><span>{copy.tempo}</span><div className="unit-input"><input value={draft.bpm} onChange={(event) => onUpdate("bpm", event.target.value)} inputMode="numeric" min="30" max="300" placeholder={copy.auto} /><em>BPM</em></div></label>
        <label><span>{copy.keyScale}</span><input value={draft.keyScale} onChange={(event) => onUpdate("keyScale", event.target.value)} placeholder={copy.auto} /></label>
        <label><span>{copy.meter}</span><select value={draft.timeSignature} onChange={(event) => onUpdate("timeSignature", event.target.value)}><option value="">{copy.auto}</option><option value="2">2 / 4</option><option value="3">3 / 4</option><option value="4">4 / 4</option><option value="6">6 / 8</option></select></label>
      </div>

      <details className="advanced-settings">
        <summary><span>{copy.advanced}</span><ChevronDown size={17} aria-hidden="true" /></summary>
        <div className="form-grid four-up advanced-grid">
          <label><span>{copy.duration}</span><div className="unit-input"><input value={draft.duration} onChange={(event) => onUpdate("duration", event.target.value)} inputMode="decimal" min="10" max="600" /><em>{copy.seconds}</em></div></label>
          <label><span>{copy.steps}</span><input value={draft.steps} onChange={(event) => onUpdate("steps", event.target.value)} inputMode="numeric" min="1" max="200" /></label>
          <label><span>{copy.guidance}</span><input value={draft.guidance} onChange={(event) => onUpdate("guidance", event.target.value)} inputMode="decimal" min="1" max="20" /></label>
          <label><span>{copy.batch}</span><input value={draft.batchSize} onChange={(event) => onUpdate("batchSize", event.target.value)} inputMode="numeric" min="1" max="8" /></label>
        </div>
        <label className="check-row seed-row"><input type="checkbox" checked={draft.useRandomSeed} onChange={(event) => onUpdate("useRandomSeed", event.target.checked)} /><span>{copy.randomSeed}</span><Dice5 size={16} aria-hidden="true" /></label>
        {!draft.useRandomSeed && <label className="seed-input"><span>{copy.seed}</span><input value={draft.seed} onChange={(event) => onUpdate("seed", event.target.value)} inputMode="numeric" placeholder={copy.seedPlaceholder} /></label>}
      </details>
    </section>
  );
}
