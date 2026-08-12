import type { Locale } from "./locale";

export function getCodeCopy(locale: Locale) {
  if (locale === "ja") {
    return {
      copy: "コピー",
      copied: "コピー済み",
      failed: "手動でコピー",
      copyLabel(label: string) { return `${label}をコピー`; },
    };
  }

  return {
    copy: "Copy",
    copied: "Copied",
    failed: "Copy manually",
    copyLabel(label: string) { return `Copy ${label}`; },
  };
}
