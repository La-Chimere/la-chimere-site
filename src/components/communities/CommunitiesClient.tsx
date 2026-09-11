"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { AvatarCircle } from "@/components/ui/AvatarCircle";
import { EventModal } from "@/components/events/EventModal";
import { isoDate, relativeActivityDays, shortWeekday } from "@/lib/dates";
import { formatActivity } from "@/lib/i18n/format";
import { joinCommunity } from "@/lib/profile-actions";
import { useT } from "@/components/i18n/LocaleProvider";
import type { CommunityOption, EventItem } from "@/lib/events-types";
import type { CommunityMember, ParticipationRecord } from "@/lib/community-types";

interface CommunitiesClientProps {
  communities: CommunityOption[];
  members: CommunityMember[];
  events: EventItem[];
  participations: ParticipationRecord[];
  currentUserId: string;
  isAdmin: boolean;
}

const PAGE_SIZE = 10;

// Communautés (CDC 12.8) : sélection multiple ("Tous" par défaut, mutuellement
// exclusif avec une sélection spécifique), évènements à venir (ou passés, sur
// bascule) correspondants avec pagination, et membres triés par activité la
// plus récente dans la sélection courante.
export function CommunitiesClient({
  communities,
  members,
  events,
  participations,
  currentUserId,
  isAdmin,
}: CommunitiesClientProps) {
  const { t, locale } = useT();
  const [selected, setSelected] = useState<string[]>([]);
  const [showPast, setShowPast] = useState(false);
  const [page, setPage] = useState(0);
  const [openEventId, setOpenEventId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const today = isoDate(new Date());

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  const realEvents = useMemo(() => events.filter((e) => e.type !== "dispo"), [events]);

  const filteredEvents = useMemo(() => {
    const byCommunity =
      selected.length === 0
        ? realEvents
        : realEvents.filter((e) => e.communities.some((c) => selected.includes(c.id)));
    const byTime = byCommunity.filter((e) =>
      showPast ? e.eventDate < today : e.eventDate >= today,
    );
    return [...byTime].sort((a, b) => {
      const cmp = a.eventDate === b.eventDate ? a.startTime.localeCompare(b.startTime) : a.eventDate.localeCompare(b.eventDate);
      return showPast ? -cmp : cmp;
    });
  }, [realEvents, selected, showPast, today]);

  useEffect(() => {
    setPage(0);
  }, [selected, showPast]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const pagedEvents = filteredEvents.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const lastActivityByMember = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of participations) {
      if (selected.length > 0 && !p.communityIds.some((c) => selected.includes(c))) continue;
      const current = map.get(p.profileId);
      if (!current || p.eventDate > current) map.set(p.profileId, p.eventDate);
    }
    return map;
  }, [participations, selected]);

  const filteredMembers = useMemo(() => {
    const matching =
      selected.length === 0
        ? members
        : members.filter((m) => m.communityIds.some((c) => selected.includes(c)));
    return [...matching].sort((a, b) => {
      const da = lastActivityByMember.get(a.profileId) ?? "";
      const db = lastActivityByMember.get(b.profileId) ?? "";
      return db.localeCompare(da);
    });
  }, [members, selected, lastActivityByMember]);

  // Le bouton "Rejoindre" n'a de sens que sur une seule communauté à la fois,
  // et seulement si l'utilisateur courant n'en fait pas déjà partie.
  const singleSelectedId = selected.length === 1 ? selected[0] : null;
  const alreadyMember =
    !!singleSelectedId &&
    (members.find((m) => m.profileId === currentUserId)?.communityIds.includes(singleSelectedId) ?? false);
  const canJoin = !!singleSelectedId && !alreadyMember;

  function join() {
    if (!singleSelectedId) return;
    startTransition(() => {
      joinCommunity(singleSelectedId);
    });
  }

  const openEvent = events.find((e) => e.id === openEventId) ?? null;
  const openEventKeyStatus = openEvent
    ? { ok: openEvent.participants.some((p) => p.hasKey), from: openEvent.startTime }
    : null;

  return (
    <div className="page">
      <h1 className="page-title">{t("communities.title")}</h1>
      <div className="filters h-scroll" id="communityFilters">
        <Chip variant="outline" active={selected.length === 0} onClick={() => setSelected([])}>
          {t("common.all")}
        </Chip>
        {communities.map((c) => (
          <Chip
            key={c.id}
            variant="outline"
            active={selected.includes(c.id)}
            onClick={() => toggle(c.id)}
          >
            {c.label}
          </Chip>
        ))}
      </div>

      <div className="section-card">
        <h2 className="section-subtitle">
          {showPast ? t("communities.pastEvents") : t("communities.upcomingEvents")}
        </h2>
        {pagedEvents.length === 0 ? (
          <p className="empty-hint">
            {showPast ? t("communities.nothingPast") : t("communities.nothingUpcoming")}
          </p>
        ) : (
          pagedEvents.map((e) => (
            <div
              className="commu-event-row clickable"
              key={e.id}
              onClick={() => setOpenEventId(e.id)}
            >
              <span className="commu-event-day">
                {shortWeekday(new Date(e.eventDate), locale)} {parseInt(e.startTime, 10)}h
              </span>
              <span className="commu-event-title">
                {e.title || e.communities.map((c) => c.label).join(", ") || t("event.defaultTitle")}
              </span>
            </div>
          ))
        )}

        <button
          type="button"
          className="link-btn"
          style={{ marginTop: 10 }}
          onClick={() => setShowPast((v) => !v)}
        >
          {showPast ? t("communities.showUpcomingEvents") : t("communities.showPastEvents")}
        </button>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label={t("common.previous")}
            >
              ‹
            </button>
            <span>{t("communities.pageOf", { current: page + 1, total: totalPages })}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              aria-label={t("common.next")}
            >
              ›
            </button>
          </div>
        )}
      </div>

      <div className="section-card">
        <h2 className="section-subtitle">{t("communities.members")}</h2>
        {canJoin && (
          <Button variant="primary" onClick={join} style={{ marginBottom: 12 }}>
            {t("communities.join")}
          </Button>
        )}
        {filteredMembers.length === 0 ? (
          <p className="empty-hint">{t("communities.noMembers")}</p>
        ) : (
          filteredMembers.map((m) => (
            <Link href={`/members/${m.profileId}`} className="member-card" key={m.profileId}>
              <AvatarCircle name={m.displayName} photoUrl={m.avatarUrl} size="sm" />
              <div className="member-info">
                <div className="member-name">
                  {m.displayName}
                  {m.hasKey && (
                    <span className="member-key" title={t("communities.keyHolder")}>
                      🔑
                    </span>
                  )}
                </div>
                <div className="member-activity">
                  {formatActivity(t, relativeActivityDays(lastActivityByMember.get(m.profileId) ?? null))}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <EventModal
        event={openEvent}
        keyStatus={openEventKeyStatus}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onClose={() => setOpenEventId(null)}
      />
    </div>
  );
}
