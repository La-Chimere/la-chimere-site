"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/i18n/LocaleProvider";
import { setLocale } from "@/lib/i18n/actions";
import type { Locale } from "@/lib/i18n/core";

interface LanguageToggleProps {
  className?: string;
}

// Bascule de langue (CDC 14.4) : change la locale puis rafraîchit la page
// (router.refresh()) pour que tous les Server Components relisent le
// cookie et affichent le nouveau texte immédiatement.
export function LanguageToggle({ className }: LanguageToggleProps) {
  const { locale } = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div className={`segmented ${className ?? ""}`}>
      <button type="button" className={locale === "fr" ? "active" : ""} disabled={pending} onClick={() => choose("fr")}>
        Français
      </button>
      <button type="button" className={locale === "en" ? "active" : ""} disabled={pending} onClick={() => choose("en")}>
        English
      </button>
    </div>
  );
}
