import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { readLocale, writeLocale, type Locale } from "./locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(readLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = locale === "ja" ? "ACE-Step Forge — 音楽生成" : "ACE-Step Forge";
    writeLocale(locale);
  }, [locale]);

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider.");
  return context;
}
