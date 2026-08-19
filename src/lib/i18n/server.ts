import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/core";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { interpolate } from "@/lib/i18n/core";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get("chimere-locale")?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

// Traduction côté serveur (Server Components, Server Actions) : lit la
// locale depuis le cookie sans avoir à la faire remonter explicitement dans
// chaque appel — utile notamment pour les messages d'erreur renvoyés par les
// Server Actions (CDC : app traduite en anglais, cf. demande utilisateur).
export async function serverT(key: string, params?: Record<string, string | number>) {
  const locale = await getLocale();
  const dict = dictionaries[locale];
  const template = dict[key] ?? dictionaries[DEFAULT_LOCALE][key] ?? key;
  return interpolate(template, params);
}
