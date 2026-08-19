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
import { fr } from "date-fns/locale";

// Le club est basé en Suisse (voir CDC section 6.1) ; la semaine commence le
// lundi comme c'est l'usage en Suisse romande.
const WEEK_OPTIONS = { locale: fr, weekStartsOn: 1 as const };

export function weekRangeLabel(reference: Date): string {
  const start = startOfWeek(reference, WEEK_OPTIONS);
  const end = endOfWeek(reference, WEEK_OPTIONS);
  const startDay = format(start, "d");
  const endDay = format(end, "d");
  const endMonth = format(end, "MMM", { locale: fr }).replace(".", "");
  const capitalized = endMonth.charAt(0).toUpperCase() + endMonth.slice(1);
  return `${startDay} – ${endDay} ${capitalized}`;
}

export function monthLabel(reference: Date): string {
  const label = format(reference, "MMMM", { locale: fr });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function daysOfWeek(reference: Date): Date[] {
  const start = startOfWeek(reference, WEEK_OPTIONS);
  const end = endOfWeek(reference, WEEK_OPTIONS);
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
  const start = startOfWeek(startOfMonth(reference), WEEK_OPTIONS);
  const end = endOfWeek(endOfMonth(reference), WEEK_OPTIONS);
  return eachDayOfInterval({ start, end });
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function isSameMonth(date: Date, reference: Date): boolean {
  return date.getMonth() === reference.getMonth();
}

export function dayLabel(date: Date): string {
  const label = format(date, "EEEE d MMMM", { locale: fr });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function isoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
