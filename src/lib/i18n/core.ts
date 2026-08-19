export type Locale = "fr" | "en";

export const LOCALE_COOKIE = "chimere-locale";
export const DEFAULT_LOCALE: Locale = "fr";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "fr" || value === "en";
}

// Interpolation simple : remplace {name} par la valeur correspondante.
export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in params ? String(params[key]) : match,
  );
}
