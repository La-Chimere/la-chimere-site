import { createClient } from "@/lib/supabase/server";
import { AnnouncementsClient } from "@/components/announcements/AnnouncementsClient";
import type { Announcement, NotificationItem, Poll } from "@/lib/announcements-types";
import type { CommunityOption } from "@/lib/events-types";

function oneOrFirst<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [
    { data: profile },
    { data: myCommunities },
    { data: communitiesData },
    { data: announcementsData },
    { data: readsData },
    { data: notificationsData },
  ] = await Promise.all([
    supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
    supabase.from("profile_communities").select("community_id").eq("profile_id", user.id),
    supabase.from("communities").select("id, key, label, competitive").eq("hidden", false).order("label"),
    supabase
      .from("announcements")
      .select(
        `id, title, description, target_community_id, announcement_date, banner, banner_text, created_by,
        communities(label),
        polls(id, question, type,
          poll_options(id, label),
          poll_votes(profile_id, option_id, rating))`,
      )
      .order("announcement_date", { ascending: false }),
    supabase.from("announcement_reads").select("announcement_id").eq("profile_id", user.id),
    supabase
      .from("notifications")
      .select("id, type, message, read, created_at")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const isAdmin = profile?.is_admin ?? false;
  const myCommunityIds = new Set((myCommunities ?? []).map((c) => c.community_id));
  const seenIds = new Set((readsData ?? []).map((r) => r.announcement_id));

  const communities: CommunityOption[] = (communitiesData ?? []).map((c) => ({
    id: c.id,
    key: c.key,
    label: c.label,
    competitive: c.competitive,
  }));

  const allAnnouncements: Announcement[] = (announcementsData ?? []).map((a) => {
    const communityLink = oneOrFirst(a.communities);
    const pollRow = oneOrFirst(a.polls);

    let poll: Poll | null = null;
    if (pollRow) {
      const votes = pollRow.poll_votes ?? [];
      const myVotes = votes.filter((v) => v.profile_id === user.id);
      const ratingCounts: Record<number, number> = {};
      for (const v of votes) {
        if (v.rating) ratingCounts[v.rating] = (ratingCounts[v.rating] ?? 0) + 1;
      }
      poll = {
        id: pollRow.id,
        question: pollRow.question,
        type: pollRow.type as Poll["type"],
        options: (pollRow.poll_options ?? []).map((o) => ({
          id: o.id,
          label: o.label,
          voteCount: votes.filter((v) => v.option_id === o.id).length,
        })),
        myOptionIds: myVotes.map((v) => v.option_id).filter((id): id is string => !!id),
        myRating: myVotes.find((v) => v.rating)?.rating ?? null,
        ratingCounts,
      };
    }

    return {
      id: a.id,
      title: a.title,
      description: a.description,
      targetCommunityId: a.target_community_id,
      targetCommunityLabel: communityLink?.label ?? null,
      announcementDate: a.announcement_date,
      banner: a.banner,
      bannerText: a.banner_text,
      createdBy: a.created_by,
      poll,
      seen: seenIds.has(a.id),
    };
  });

  const visibleAnnouncements = isAdmin
    ? allAnnouncements
    : allAnnouncements.filter(
        (a) => !a.targetCommunityId || myCommunityIds.has(a.targetCommunityId),
      );

  const notifications: NotificationItem[] = (notificationsData ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    message: n.message,
    read: n.read,
    createdAt: n.created_at,
  }));

  return (
    <AnnouncementsClient
      announcements={visibleAnnouncements}
      notifications={notifications}
      communities={communities}
      isAdmin={isAdmin}
      currentUserId={user.id}
    />
  );
}
