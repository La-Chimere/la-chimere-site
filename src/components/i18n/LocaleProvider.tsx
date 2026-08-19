"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { interpolate, type Locale } from "@/lib/i18n/core";
import { dictionaries } from "@/lib/i18n/dictionaries";

interface LocaleContextValue {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps {
  locale: Locale;
  children: ReactNode;
}

// Fournit la traduction à tous les composants client sans avoir à faire
// remonter `locale`/`t` en props à travers tout l'arbre — initialisé avec la
// locale détectée côté serveur (cookie) pour éviter tout flash/mismatch
// d'hydratation.
export function LocaleProvider({ locale, children }: LocaleProviderProps) {
  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      t: (key, params) => {
        const dict = dictionaries[locale];
        const template = dict[key] ?? dictionaries.fr[key] ?? key;
        return interpolate(template, params);
      },
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useT() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useT must be used within a LocaleProvider");
  return ctx;
}
