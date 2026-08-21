"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { AvatarCircle } from "@/components/ui/AvatarCircle";
import { relativeActivityDays, shortWeekday } from "@/lib/dates";
import { formatActivity } from "@/lib/i18n/format";
import { joinCommunity } from "@/lib/profile-actions";
import { useT } from "@/components/i18n/LocaleProvider";
import type { CommunityOption } from "@/lib/events-types";
import type {
  CommunityMember,
  ParticipationRecord,
  UpcomingCommunityEvent,
} from "@/lib/community-types";

interface CommunitiesClientProps {
  communities: CommunityOption[];
  members: CommunityMember[];
  upcomingEvents: UpcomingCommunityEvent[];
  participations: ParticipationRecord[];
  currentUserId: string | null;
}

// Communautés (CDC 12.8) : sélection multiple ("Tous" par défaut, mutuellement
// exclusif avec une sélection spécifique), évènements à venir correspondants,
// et membres triés par activité la plus récente dans la sélection courante.
export function CommunitiesClient({
  communities,
  members,
  upcomingEvents,
  participations,
  currentUserId,
}: CommunitiesClientProps) {
  const { t, locale } = useT();
  const [selected, setSelected] = useState<string[]>([]);
  const [, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  const filteredEvents = useMemo(() => {
    if (selected.length === 0) return upcomingEvents;
    return upcomingEvents.filter((e) => e.communityIds.some((c) => selected.includes(c)));
  }, [upcomingEvents, selected]);

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
    !!currentUserId &&
    !!singleSelectedId &&
    (members.find((m) => m.profileId === currentUserId)?.communityIds.includes(singleSelectedId) ?? false);
  const canJoin = !!currentUserId && !!singleSelectedId && !alreadyMember;

  function join() {
    if (!singleSelectedId) return;
    startTransition(() => {
      joinCommunity(singleSelectedId);
    });
  }

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
        <h2 className="section-subtitle">{t("communities.upcomingEvents")}</h2>
        {filteredEvents.length === 0 ? (
          <p className="empty-hint">{t("communities.nothingUpcoming")}</p>
        ) : (
          filteredEvents.map((e) => (
            <div className="commu-event-row" key={e.id}>
              <span className="commu-event-day">
                {shortWeekday(new Date(e.eventDate), locale)} {parseInt(e.startTime, 10)}h
              </span>
              <span className="commu-event-title">
                {e.title || e.communityLabels.join(", ") || t("event.defaultTitle")}
              </span>
            </div>
          ))
        )}
      </div>

      {canJoin && (
        <Button variant="primary" full onClick={join}>
          {t("communities.join")}
        </Button>
      )}

      <div className="section-card">
        <h2 className="section-subtitle">{t("communities.members")}</h2>
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
    </div>
  );
}
