import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useLocale } from "../i18n/LocaleProvider";
import { getCodeCopy } from "../i18n/codeCopy";

interface CodeSnippetProps {
  label: string;
  code: string;
  compact?: boolean;
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const fallback = document.createElement("textarea");
  fallback.value = value;
  fallback.setAttribute("readonly", "");
  fallback.style.position = "fixed";
  fallback.style.opacity = "0";
  document.body.append(fallback);
  fallback.select();
  const copied = document.execCommand("copy");
  fallback.remove();
  if (!copied) throw new Error("Clipboard access was unavailable.");
}

export function CodeSnippet({ label, code, compact = false }: CodeSnippetProps) {
  const { locale } = useLocale();
  const copy = getCodeCopy(locale);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const copyCode = async () => {
    try {
      await copyText(code);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    window.setTimeout(() => setCopyState("idle"), 1800);
  };

  const status = copyState === "copied" ? copy.copied : copyState === "failed" ? copy.failed : copy.copy;

  return (
    <div className={`code-snippet${compact ? " is-compact" : ""}`}>
      <div className="code-snippet-bar">
        <span>{label}</span>
        <button type="button" onClick={() => void copyCode()} aria-label={copy.copyLabel(label)}>
          {copyState === "copied" ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {status}
        </button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
}
