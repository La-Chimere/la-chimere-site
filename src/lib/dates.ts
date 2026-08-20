import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameDay,
} from "date-fns";
import { fr, enUS } from "date-fns/locale";
import type { Locale } from "@/lib/i18n/core";

function dfnsLocale(locale: Locale) {
  return locale === "en" ? enUS : fr;
}

// Le club est basé en Suisse (voir CDC section 6.1) ; la semaine commence le
// lundi comme c'est l'usage en Suisse romande, quelle que soit la langue
// d'affichage choisie (CDC : bascule de langue en 14.4).
const WEEK_STARTS_ON = 1 as const;

export function weekRangeLabel(reference: Date, locale: Locale = "fr"): string {
  const options = { locale: dfnsLocale(locale), weekStartsOn: WEEK_STARTS_ON };
  const start = startOfWeek(reference, options);
  const end = endOfWeek(reference, options);
  const startDay = format(start, "d");
  const endDay = format(end, "d");
  const endMonth = format(end, "MMM", options).replace(".", "");
  const capitalized = endMonth.charAt(0).toUpperCase() + endMonth.slice(1);
  return `${startDay} – ${endDay} ${capitalized}`;
}

export function monthLabel(reference: Date, locale: Locale = "fr"): string {
  const label = format(reference, "MMMM", { locale: dfnsLocale(locale) });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function daysOfWeek(reference: Date): Date[] {
  const options = { weekStartsOn: WEEK_STARTS_ON };
  const start = startOfWeek(reference, options);
  const end = endOfWeek(reference, options);
  return eachDayOfInterval({ start, end });
}

export function nextWeek(reference: Date): Date {
  return addWeeks(reference, 1);
}

export function previousWeek(reference: Date): Date {
  return subWeeks(reference, 1);
}

export function nextMonth(reference: Date): Date {
  return addMonths(reference, 1);
}

export function previousMonth(reference: Date): Date {
  return subMonths(reference, 1);
}

export function monthGridDays(reference: Date): Date[] {
  const options = { weekStartsOn: WEEK_STARTS_ON };
  const start = startOfWeek(startOfMonth(reference), options);
  const end = endOfWeek(endOfMonth(reference), options);
  return eachDayOfInterval({ start, end });
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function isSameMonth(date: Date, reference: Date): boolean {
  return date.getMonth() === reference.getMonth();
}

export function dayLabel(date: Date, locale: Locale = "fr"): string {
  const label = format(date, "EEEE d MMMM", { locale: dfnsLocale(locale) });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Format court "Mardi 18" pour l'en-tête de chaque jour dans la liste Programme
// (le mois est déjà donné par l'en-tête de semaine juste au-dessus, cf. CDC 12.10).
export function dayHeaderLabel(date: Date, locale: Locale = "fr"): string {
  const label = format(date, "EEEE d", { locale: dfnsLocale(locale) });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Format compact "Mer. 19 août" / "Wed 19 Aug" pour les listes d'évènements
// condensées (CDC 12.8 : liste des évènements à venir par communauté).
export function shortDayLabel(date: Date, locale: Locale = "fr"): string {
  const label = format(date, "EEE d MMM", { locale: dfnsLocale(locale) }).replace(/\./g, "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Jour abrégé seul, ex. "Mer" (CDC 12.8 : liste des évènements à venir par communauté).
export function shortWeekday(date: Date, locale: Locale = "fr"): string {
  const label = format(date, "EEE", { locale: dfnsLocale(locale) }).replace(/\.$/, "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Heure compacte "18h" / "18h30" (CDC 12.4/12.10 : format d'affichage des horaires).
export function formatHour(time: string): string {
  const [h, m] = time.split(":");
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

export function isoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

// "Dernière partie aujourd'hui / hier / il y a X jours" (CDC 12.8/12.11).
export function relativeActivityDays(isoDateString: string | null): number | null {
  if (!isoDateString) return null;
  return Math.round(
    (new Date(isoDate(new Date())).getTime() - new Date(isoDateString).getTime()) /
      86_400_000,
  );
}
