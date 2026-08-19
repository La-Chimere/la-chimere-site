"use client";

import { format } from "date-fns";
import { isSameMonth, isToday, isoDate, monthGridDays } from "@/lib/dates";
import type { EventItem } from "@/lib/events-types";
import { useT } from "@/components/i18n/LocaleProvider";

interface MonthGridProps {
  reference: Date;
  events: EventItem[]; // jamais de disponibilités (CDC 12.10)
  onOpenEvent: (eventId: string) => void;
}

const MAX_TAGS_PER_CELL = 3;

export function MonthGrid({ reference, events, onOpenEvent }: MonthGridProps) {
  const { t } = useT();
  const weekdayKeys = [
    "date.mon",
    "date.tue",
    "date.wed",
    "date.thu",
    "date.fri",
    "date.sat",
    "date.sun",
  ];
  const days = monthGridDays(reference);

  const eventsByDay = new Map<string, EventItem[]>();
  for (const event of events) {
    const list = eventsByDay.get(event.eventDate) ?? [];
    list.push(event);
    eventsByDay.set(event.eventDate, list);
  }

  return (
    <div className="month-grid">
      <div className="month-grid-header">
        {weekdayKeys.map((key) => (
          <div className="mgh-cell" key={key}>
            {t(key)}
          </div>
        ))}
      </div>
      <div className="month-grid-body">
        {days.map((day) => {
          const iso = isoDate(day);
          const inMonth = isSameMonth(day, reference);
          const dayEvents = eventsByDay.get(iso) ?? [];
          const visible = dayEvents.slice(0, MAX_TAGS_PER_CELL);
          const overflow = dayEvents.length - visible.length;

          return (
            <div
              className={`month-cell ${!inMonth ? "is-pad" : ""} ${isToday(day) ? "is-today" : ""}`}
              key={iso}
            >
              {inMonth && (
                <>
                  <span className="mc-num">{format(day, "d")}</span>
                  <div className="month-evt-row">
                    {visible.map((event) => {
                      const label =
                        event.communities.length > 0
                          ? event.communities.map((c) => c.label).join(", ")
                          : event.title || t("event.genericEvent");
                      const hasKeyHolder = event.participants.some((p) => p.hasKey);
                      return (
                        <span
                          key={event.id}
                          className={`month-evt ${!hasKeyHolder ? "no-key" : ""}`}
                          onClick={() => onOpenEvent(event.id)}
                          title={label}
                        >
                          {label}
                        </span>
                      );
                    })}
                    {overflow > 0 && <span className="month-more">+{overflow}</span>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
