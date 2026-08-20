"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Chip } from "@/components/ui/Chip";
import { Fab } from "@/components/ui/Fab";
import { EventCard } from "@/components/events/EventCard";
import { EventModal } from "@/components/events/EventModal";
import { EventForm } from "@/components/events/EventForm";
import { MonthGrid } from "@/components/events/MonthGrid";
import { AvailabilityMenu } from "@/components/events/AvailabilityMenu";
import type { PickableMember } from "@/components/ui/MemberPicker";
import type { CommunityOption, EventItem } from "@/lib/events-types";
import {
  dayHeaderLabel,
  isoDate,
  monthLabel,
  nextMonth,
  nextWeek,
  previousMonth,
  previousWeek,
  weekRangeLabel,
} from "@/lib/dates";
import { useT } from "@/components/i18n/LocaleProvider";

interface ProgrammeClientProps {
  reference: string; // ISO date de référence (semaine ou mois affiché)
  days: string[]; // ISO dates des 7 jours de la semaine affichée
  events: EventItem[]; // couvre toujours au moins la grille du mois de référence
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
  const [navPending, startNavTransition] = useTransition();
  const { t, locale } = useT();
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [openEventId, setOpenEventId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [availFormOpen, setAvailFormOpen] = useState(false);
  const [calView, setCalView] = useState(false);
  const [showAvailabilities, setShowAvailabilities] = useState(false);
  const [copiedAlertDay, setCopiedAlertDay] = useState<string | null>(null);

  const referenceDate = new Date(reference);

  const realEvents = useMemo(() => events.filter((e) => e.type !== "dispo"), [events]);
  const availabilities = useMemo(() => events.filter((e) => e.type === "dispo"), [events]);

  // Statut "porteur de clé" par jour (CDC 12.10) : calculé sur TOUTES les
  // parties/évènements confirmés du jour, indépendamment du filtre communauté
  // affiché (savoir si quelqu'un a une clé ne dépend pas du filtre en cours).
  const keyStatusByDay = useMemo(() => {
    const map = new Map<string, { ok: boolean; from?: string }>();
    const allDays = new Set(realEvents.map((e) => e.eventDate));
    for (const day of allDays) {
      const dayRealEvents = realEvents.filter((e) => e.eventDate === day);
      if (dayRealEvents.length === 0) continue;
      const covered = dayRealEvents.filter((e) => e.participants.some((p) => p.hasKey));
      if (covered.length === 0) {
        map.set(day, { ok: false });
        continue;
      }
      const from = covered.reduce(
        (min, e) => (e.startTime < min ? e.startTime : min),
        covered[0].startTime,
      );
      map.set(day, { ok: true, from });
    }
    return map;
  }, [realEvents]);

  function sendKeyAlert(day: string) {
    const message = t("programme.keyAlertMessage", { day: dayHeaderLabel(new Date(day), locale) });
    navigator.clipboard?.writeText(message);
    setCopiedAlertDay(day);
    setTimeout(() => setCopiedAlertDay((current) => (current === day ? null : current)), 2000);
  }

  const communityFiltered = useMemo(() => {
    if (!selectedCommunity) return realEvents;
    return realEvents.filter((e) => e.communities.some((c) => c.id === selectedCommunity));
  }, [realEvents, selectedCommunity]);

  const listEvents = useMemo(() => {
    if (!showAvailabilities) return communityFiltered;
    const filteredAvail = selectedCommunity
      ? availabilities.filter((e) => e.communities.some((c) => c.id === selectedCommunity))
      : availabilities;
    return [...communityFiltered, ...filteredAvail].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );
  }, [communityFiltered, availabilities, showAvailabilities, selectedCommunity]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const day of days) map.set(day, []);
    for (const event of listEvents) {
      map.get(event.eventDate)?.push(event);
    }
    return map;
  }, [listEvents, days]);

  function navigate(delta: number) {
    const d = calView ? (delta > 0 ? nextMonth(referenceDate) : previousMonth(referenceDate)) : (delta > 0 ? nextWeek(referenceDate) : previousWeek(referenceDate));
    startNavTransition(() => {
      router.push(`/programme?week=${isoDate(d)}`);
    });
  }

  const allFilteredForModal = [...realEvents, ...availabilities];
  const openEvent = allFilteredForModal.find((e) => e.id === openEventId) ?? null;

  return (
    <div className="page no-scroll">
      <div className="events-fixed-top">
        <div className="cal-toolbar">
          <div className="toolbar-left">
            <div className="datenav-group">
              <div className="datenav">
                <button type="button" onClick={() => navigate(-1)} aria-label={t("common.previous")}>
                  ‹
                </button>
                <span id="navLabel">
                  {calView ? monthLabel(referenceDate, locale) : weekRangeLabel(referenceDate, locale)}
                </span>
                <button type="button" onClick={() => navigate(1)} aria-label={t("common.next")}>
                  ›
                </button>
              </div>
              <button
                type="button"
                className={`view-toggle ${calView ? "active" : ""}`}
                onClick={() => setCalView((v) => !v)}
                aria-label={t("programme.calendarView")}
              >
                📆
              </button>
            </div>
            <AvailabilityMenu
              showAvailabilities={showAvailabilities}
              onToggleShow={() => setShowAvailabilities((v) => !v)}
              onIndicate={() => setAvailFormOpen(true)}
            />
          </div>
        </div>
        <div className="filters h-scroll">
          <Chip variant="outline" active={!selectedCommunity} onClick={() => setSelectedCommunity(null)}>
            {t("common.all")}
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

      <div className={`events-list-scroll ${calView ? "cal-mode" : ""}`}>
        {navPending && (
          <div className="loading-overlay">
            <div className="spinner" />
          </div>
        )}
        {calView ? (
          <MonthGrid
            reference={referenceDate}
            events={communityFiltered}
            onOpenEvent={setOpenEventId}
          />
        ) : (
          days.map((day) => {
            const dayEvents = eventsByDay.get(day) ?? [];
            const isToday = day === isoDate(new Date());
            const keyStatus = keyStatusByDay.get(day);
            return (
              <div className={`day-unit ${isToday ? "today" : ""}`} key={day}>
                <div className="day-head">
                  <div className="day-head-left">
                    <span className="d1">{dayHeaderLabel(new Date(day), locale)}</span>
                    {isToday && <span className="d2">{t("date.today")}</span>}
                    {keyStatus &&
                      (keyStatus.ok ? (
                        <span className="tag ok">
                          🔑 {t("programme.keyFromHour", { hour: parseInt(keyStatus.from!, 10) })}
                        </span>
                      ) : (
                        <span className="tag warn">⚠ {t("programme.noKey")}</span>
                      ))}
                  </div>
                  {keyStatus && !keyStatus.ok && (
                    <button type="button" className="cta-mini" onClick={() => sendKeyAlert(day)}>
                      {copiedAlertDay === day ? t("programme.alertCopied") : t("programme.sendAlert")}
                    </button>
                  )}
                </div>
                {dayEvents.length === 0 ? (
                  <div className="agenda-empty">{t("programme.nothingPlanned")}</div>
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
          })
        )}
      </div>

      <Fab onClick={() => setFormOpen(true)} title={t("event.form.fabTitle")} />
      <EventModal
        event={openEvent}
        keyStatus={openEvent ? (keyStatusByDay.get(openEvent.eventDate) ?? null) : null}
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
      <EventForm
        open={availFormOpen}
        onClose={() => setAvailFormOpen(false)}
        communities={communities}
        members={members}
        currentUser={currentUser}
        defaultDate={referenceDate}
        isAvailability
      />
    </div>
  );
}
