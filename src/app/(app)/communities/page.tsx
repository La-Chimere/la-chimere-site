import { createClient } from "@/lib/supabase/server";
import { isoDate } from "@/lib/dates";
import { CommunitiesClient } from "@/components/communities/CommunitiesClient";
import type { CommunityOption } from "@/lib/events-types";
import type {
  CommunityMember,
  ParticipationRecord,
  UpcomingCommunityEvent,
} from "@/lib/community-types";

function oneOrFirst<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default async function CommunitiesPage() {
  const supabase = await createClient();
  const today = isoDate(new Date());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: communitiesData },
    { data: profilesData },
    { data: upcomingData },
    { data: participantsData },
  ] = await Promise.all([
    supabase
      .from("communities")
      .select("id, key, label, competitive")
      .eq("hidden", false)
      .order("label"),
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url, has_key, profile_communities(community_id)"),
    supabase
      .from("events")
      .select(
        "id, title, event_date, start_time, event_communities(communities(id, label))",
      )
      .gte("event_date", today)
      .order("event_date")
      .order("start_time"),
    supabase
      .from("event_participants")
      .select("profile_id, events(event_date, event_communities(community_id))"),
  ]);

  const communities: CommunityOption[] = (communitiesData ?? []).map((c) => ({
    id: c.id,
    key: c.key,
    label: c.label,
    competitive: c.competitive,
  }));

  const members: CommunityMember[] = (profilesData ?? []).map((p) => ({
    profileId: p.id,
    displayName: p.display_name,
    avatarUrl: p.avatar_url,
    hasKey: p.has_key,
    communityIds: (p.profile_communities ?? [])
      .map((pc) => pc.community_id)
      .filter((id): id is string => !!id),
  }));

  const upcomingEvents: UpcomingCommunityEvent[] = (upcomingData ?? []).map((e) => {
    const links = (e.event_communities ?? [])
      .map((ec) => oneOrFirst(ec.communities))
      .filter((c): c is NonNullable<typeof c> => !!c);
    return {
      id: e.id,
      title: e.title,
      eventDate: e.event_date,
      startTime: e.start_time,
      communityIds: links.map((c) => c.id),
      communityLabels: links.map((c) => c.label),
    };
  });

  const participations: ParticipationRecord[] = (participantsData ?? [])
    .map((p) => {
      const event = oneOrFirst(p.events);
      if (!event) return null;
      return {
        profileId: p.profile_id,
        eventDate: event.event_date,
        communityIds: (event.event_communities ?? [])
          .map((ec) => ec.community_id)
          .filter((id): id is string => !!id),
      };
    })
    .filter((p): p is ParticipationRecord => !!p);

  return (
    <CommunitiesClient
      communities={communities}
      members={members}
      upcomingEvents={upcomingEvents}
      participations={participations}
      currentUserId={user?.id ?? null}
    />
  );
}
