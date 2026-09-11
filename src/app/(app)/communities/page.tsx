import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommunitiesClient } from "@/components/communities/CommunitiesClient";
import type { CommunityOption, EventItem } from "@/lib/events-types";
import type { CommunityMember, ParticipationRecord } from "@/lib/community-types";

function oneOrFirst<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default async function CommunitiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: myProfile },
    { data: communitiesData },
    { data: profilesData },
    { data: eventsData },
  ] = await Promise.all([
    supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
    supabase.from("communities").select("id, key, label, competitive").eq("hidden", false).order("label"),
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url, has_key, profile_communities(community_id)"),
    supabase
      .from("events")
      .select(
        `id, type, title, description, event_date, start_time, end_time, created_by, repeats_weekly,
        event_communities(communities(id, key, label, competitive)),
        event_participants(profile_id, result, profiles(display_name, has_key, avatar_url))`,
      )
      .order("event_date")
      .order("start_time"),
  ]);

  const members: CommunityMember[] = (profilesData ?? []).map((p) => ({
    profileId: p.id,
    displayName: p.display_name,
    avatarUrl: p.avatar_url,
    hasKey: p.has_key,
    communityIds: (p.profile_communities ?? [])
      .map((pc) => pc.community_id)
      .filter((id): id is string => !!id),
  }));

  // Communautés triées par popularité (nombre de membres décroissant) —
  // à égalité, ordre alphabétique pour rester déterministe.
  const memberCountByCommunity = new Map<string, number>();
  for (const m of members) {
    for (const communityId of m.communityIds) {
      memberCountByCommunity.set(communityId, (memberCountByCommunity.get(communityId) ?? 0) + 1);
    }
  }
  const communities: CommunityOption[] = (communitiesData ?? [])
    .map((c) => ({ id: c.id, key: c.key, label: c.label, competitive: c.competitive }))
    .sort((a, b) => {
      const diff = (memberCountByCommunity.get(b.id) ?? 0) - (memberCountByCommunity.get(a.id) ?? 0);
      return diff !== 0 ? diff : a.label.localeCompare(b.label);
    });

  const events: EventItem[] = (eventsData ?? []).map((e) => ({
    id: e.id,
    type: e.type as EventItem["type"],
    title: e.title,
    description: e.description,
    eventDate: e.event_date,
    startTime: e.start_time,
    endTime: e.end_time,
    createdBy: e.created_by,
    repeatsWeekly: e.repeats_weekly,
    communities: (e.event_communities ?? [])
      .map((ec) => oneOrFirst(ec.communities))
      .filter((c): c is NonNullable<typeof c> => !!c)
      .map((c) => ({ id: c.id, key: c.key, label: c.label, competitive: c.competitive })),
    participants: (e.event_participants ?? [])
      .map((p) => ({ ...p, profiles: oneOrFirst(p.profiles) }))
      .filter((p) => p.profiles)
      .map((p) => ({
        profileId: p.profile_id,
        displayName: p.profiles!.display_name,
        hasKey: p.profiles!.has_key,
        avatarUrl: p.profiles!.avatar_url,
        result: p.result as EventItem["participants"][number]["result"],
      })),
  }));

  const participations: ParticipationRecord[] = events.flatMap((e) =>
    e.participants.map((p) => ({
      profileId: p.profileId,
      eventDate: e.eventDate,
      communityIds: e.communities.map((c) => c.id),
    })),
  );

  return (
    <CommunitiesClient
      communities={communities}
      members={members}
      events={events}
      participations={participations}
      currentUserId={user.id}
      isAdmin={myProfile?.is_admin ?? false}
    />
  );
}
