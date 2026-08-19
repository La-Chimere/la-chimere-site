"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Chip } from "@/components/ui/Chip";
import { Fab } from "@/components/ui/Fab";
import { EventCard } from "@/components/events/EventCard";
import { EventModal } from "@/components/events/EventModal";
import { EventForm } from "@/components/events/EventForm";
import type { PickableMember } from "@/components/ui/MemberPicker";
import type { CommunityOption, EventItem } from "@/lib/events-types";
import { dayLabel, isoDate, weekRangeLabel } from "@/lib/dates";

interface ProgrammeClientProps {
  reference: string; // ISO date of the reference day for the displayed week
  days: string[]; // ISO dates of the 7 days of the week
  events: EventItem[];
  communities: CommunityOption[];
  members: PickableMember[];
  currentUser: PickableMember;
  isAdmin: boolean;
}

export function ProgrammeClient({
  reference,
  days,
  events,
  communities,
  members,
  currentUser,
  isAdmin,
}: ProgrammeClientProps) {
  const router = useRouter();
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [openEventId, setOpenEventId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const filteredEvents = useMemo(() => {
    if (!selectedCommunity) return events;
    return events.filter((e) => e.communities.some((c) => c.id === selectedCommunity));
  }, [events, selectedCommunity]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const day of days) map.set(day, []);
    for (const event of filteredEvents) {
      map.get(event.eventDate)?.push(event);
    }
    return map;
  }, [filteredEvents, days]);

  function navigate(deltaWeeks: number) {
    const d = new Date(reference);
    d.setDate(d.getDate() + deltaWeeks * 7);
    router.push(`/programme?week=${isoDate(d)}`);
  }

  const openEvent = filteredEvents.find((e) => e.id === openEventId) ?? null;
  const referenceDate = new Date(reference);

  return (
    <div className="page no-scroll">
      <div className="events-fixed-top">
        <div className="cal-toolbar">
          <div className="toolbar-left">
            <div className="datenav">
              <button type="button" onClick={() => navigate(-1)} aria-label="Semaine précédente">
                ‹
              </button>
              <span id="navLabel">{weekRangeLabel(referenceDate)}</span>
              <button type="button" onClick={() => navigate(1)} aria-label="Semaine suivante">
                ›
              </button>
            </div>
          </div>
        </div>
        <div className="filters h-scroll">
          <Chip variant="outline" active={!selectedCommunity} onClick={() => setSelectedCommunity(null)}>
            Tous
          </Chip>
          {communities.map((c) => (
            <Chip
              key={c.id}
              variant="outline"
              active={selectedCommunity === c.id}
              onClick={() => setSelectedCommunity(c.id)}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="events-list-scroll">
        {days.map((day) => {
          const dayEvents = eventsByDay.get(day) ?? [];
          const isToday = day === isoDate(new Date());
          return (
            <div className={`day-unit ${isToday ? "today" : ""}`} key={day}>
              <div className="day-head">
                <div className="day-head-left">
                  <span className="d1">{dayLabel(new Date(day))}</span>
                </div>
              </div>
              {dayEvents.length === 0 ? (
                <div className="agenda-empty">Rien de prévu.</div>
              ) : (
                dayEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    currentUserId={currentUser.id}
                    onOpen={() => setOpenEventId(event.id)}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>

      <Fab onClick={() => setFormOpen(true)} />
      <EventModal
        event={openEvent}
        currentUserId={currentUser.id}
        isAdmin={isAdmin}
        onClose={() => setOpenEventId(null)}
      />
      <EventForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        communities={communities}
        members={members}
        currentUser={currentUser}
        defaultDate={referenceDate}
      />
    </div>
  );
}
