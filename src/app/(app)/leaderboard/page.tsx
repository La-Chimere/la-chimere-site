import { createClient } from "@/lib/supabase/server";
import { daysOfWeek, isoDate } from "@/lib/dates";
import { LeaderboardClient } from "@/components/leaderboard/LeaderboardClient";
import type { CommunityOption } from "@/lib/events-types";
import type { LeaderboardData, LeaderboardRow } from "@/lib/leaderboard-types";

function oneOrFirst<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const [{ data: communitiesData }, { data: participantsData }, { data: communityMembershipsData }] =
    await Promise.all([
      supabase
        .from("communities")
        .select("id, key, label, competitive")
        .eq("hidden", false)
        .order("label"),
      supabase.from("event_participants").select(
        `profile_id, result,
        events(id, event_date, event_communities(community_id)),
        profiles(display_name, avatar_url)`,
      ),
      supabase.from("profile_communities").select("community_id"),
    ]);

  // Communautés triées par popularité (nombre de membres décroissant) —
  // à égalité, ordre alphabétique pour rester déterministe.
  const memberCountByCommunity = new Map<string, number>();
  for (const row of communityMembershipsData ?? []) {
    memberCountByCommunity.set(row.community_id, (memberCountByCommunity.get(row.community_id) ?? 0) + 1);
  }
  const communities: CommunityOption[] = (communitiesData ?? [])
    .map((c) => ({ id: c.id, key: c.key, label: c.label, competitive: c.competitive }))
    .sort((a, b) => {
      const diff = (memberCountByCommunity.get(b.id) ?? 0) - (memberCountByCommunity.get(a.id) ?? 0);
      return diff !== 0 ? diff : a.label.localeCompare(b.label);
    });

  const week = daysOfWeek(new Date()).map(isoDate);
  const weekStart = week[0];
  const weekEnd = week[week.length - 1];

  function computeFor(communityId: string | null): LeaderboardData {
    const selectedCommunity = communityId
      ? communities.find((c) => c.id === communityId)
      : null;
    const competitive = selectedCommunity ? selectedCommunity.competitive : true;

    const byMember = new Map<string, LeaderboardRow>();
    const membersThisWeek = new Set<string>();
    const eventsThisWeek = new Set<string>();

    for (const row of participantsData ?? []) {
      const event = oneOrFirst(row.events);
      const profile = oneOrFirst(row.profiles);
      if (!event || !profile) continue;

      const eventCommunityIds = (event.event_communities ?? [])
        .map((ec) => ec.community_id)
        .filter((id): id is string => !!id);

      if (communityId && !eventCommunityIds.includes(communityId)) continue;

      if (event.event_date >= weekStart && event.event_date <= weekEnd) {
        membersThisWeek.add(row.profile_id);
        eventsThisWeek.add(event.id);
      }

      const existing = byMember.get(row.profile_id) ?? {
        profileId: row.profile_id,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        games: 0,
        wins: 0,
        ties: 0,
        losses: 0,
      };
      existing.games += 1;
      if (row.result === "victoire") existing.wins += 1;
      else if (row.result === "egalite") existing.ties += 1;
      else if (row.result === "defaite") existing.losses += 1;
      byMember.set(row.profile_id, existing);
    }

    const rows = Array.from(byMember.values());

    return {
      rows,
      membersThisWeek: membersThisWeek.size,
      eventsThisWeek: eventsThisWeek.size,
      competitive,
    };
  }

  // Précalcule "Tous" + chaque communauté visible côté serveur ; le client
  // bascule instantanément entre les jeux de données déjà en mémoire.
  const dataByFilter: Record<string, LeaderboardData> = {
    tous: computeFor(null),
  };
  for (const c of communities) {
    dataByFilter[c.id] = computeFor(c.id);
  }

  return <LeaderboardClient communities={communities} dataByFilter={dataByFilter} />;
}
