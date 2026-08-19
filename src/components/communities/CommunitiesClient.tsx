"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Chip } from "@/components/ui/Chip";
import { AvatarCircle } from "@/components/ui/AvatarCircle";
import { relativeActivityLabel, shortDayLabel } from "@/lib/dates";
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
}

// Communautés (CDC 12.8) : sélection multiple ("Tous" par défaut, mutuellement
// exclusif avec une sélection spécifique), évènements à venir correspondants,
// et membres triés par activité la plus récente dans la sélection courante.
export function CommunitiesClient({
  communities,
  members,
  upcomingEvents,
  participations,
}: CommunitiesClientProps) {
  const [selected, setSelected] = useState<string[]>([]);

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

  return (
    <div className="page">
      <div className="filters h-scroll" id="communityFilters">
        <Chip variant="outline" active={selected.length === 0} onClick={() => setSelected([])}>
          Tous
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

      <div className="section-subtitle">Évènements à venir</div>
      <div className="section-card">
        {filteredEvents.length === 0 ? (
          <p className="empty-hint">Rien de prévu pour l&apos;instant.</p>
        ) : (
          filteredEvents.map((e) => (
            <div className="commu-event-row" key={e.id}>
              <span className="commu-event-day">{shortDayLabel(new Date(e.eventDate))}</span>
              <span className="commu-event-title">
                {e.title || e.communityLabels.join(", ") || "Partie"}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="section-subtitle">Membres</div>
      <div className="section-card">
        {filteredMembers.length === 0 ? (
          <p className="empty-hint">Aucun membre dans cette sélection.</p>
        ) : (
          filteredMembers.map((m) => (
            <Link href={`/members/${m.profileId}`} className="member-card" key={m.profileId}>
              <AvatarCircle name={m.displayName} photoUrl={m.avatarUrl} size="sm" />
              <div className="member-info">
                <div className="member-name">
                  {m.displayName}
                  {m.hasKey && <span className="member-key">🔑</span>}
                </div>
                <div className="member-activity">
                  {relativeActivityLabel(lastActivityByMember.get(m.profileId) ?? null)}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
