import { Languages } from "lucide-react";
import { useLocale } from "../i18n/LocaleProvider";
import { getShellCopy } from "../i18n/shellCopy";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const copy = getShellCopy(locale);

  return (
    <div className="language-switcher" role="group" aria-label={copy.languageLabel}>
      <Languages size={15} aria-hidden="true" />
      <span className="language-switcher-label">{copy.languageLabel}</span>
      <button type="button" className={locale === "en" ? "is-selected" : ""} aria-pressed={locale === "en"} aria-label={copy.switchToEnglish} onClick={() => setLocale("en")}>EN</button>
      <button type="button" className={locale === "ja" ? "is-selected" : ""} aria-pressed={locale === "ja"} aria-label={copy.switchToJapanese} onClick={() => setLocale("ja")}>日本語</button>
    </div>
  );
}
