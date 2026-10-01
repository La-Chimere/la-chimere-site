import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/ui/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { signOut } from "@/lib/auth-actions";
import { serverT } from "@/lib/i18n/server";
import { isAnnouncementVisibleTo } from "@/lib/announcements-visibility";

function oneOrFirst<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: profile },
    { count: unreadCount },
    { data: announcements },
    { data: myReads },
    { data: myLeagueParticipations },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, avatar_url, is_admin, status, profile_communities(community_id)")
      .eq("id", user.id)
      .single(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", user.id)
      .eq("read", false),
    supabase.from("announcements").select("id, target_community_id, target_league_id, banner, banner_text"),
    supabase.from("announcement_reads").select("announcement_id").eq("profile_id", user.id),
    supabase.from("league_participants").select("league_divisions(league_id)").eq("profile_id", user.id),
  ]);

  if (profile?.status === "pending") {
    const [pendingTitle, pendingBody, logout] = await Promise.all([
      serverT("appLayout.pendingTitle"),
      serverT("appLayout.pendingBody"),
      serverT("header.logout"),
    ]);
    return (
      <div className="logout-screen">
        <div className="logout-icon">⏳</div>
        <h1 className="page-title">{pendingTitle}</h1>
        <p className="key-status">{pendingBody}</p>
        <form action={signOut}>
          <button type="submit" className="modal-btn gray">
            {logout}
          </button>
        </form>
      </div>
    );
  }

  const defaultMemberName = await serverT("appLayout.defaultMemberName");

  const isAdmin = profile?.is_admin ?? false;
  const myCommunityIds = new Set((profile?.profile_communities ?? []).map((c) => c.community_id));
  const myLeagueIds = new Set(
    (myLeagueParticipations ?? [])
      .map((p) => oneOrFirst(p.league_divisions)?.league_id)
      .filter((id): id is string => !!id),
  );
  const readIds = new Set((myReads ?? []).map((r) => r.announcement_id));
  const visibleAnnouncements = (announcements ?? []).filter((a) =>
    isAnnouncementVisibleTo(a.target_community_id, a.target_league_id, isAdmin, myCommunityIds, myLeagueIds),
  );
  const unseenAnnouncements = visibleAnnouncements.filter((a) => !readIds.has(a.id)).length;
  const bannerText = visibleAnnouncements.find((a) => a.banner)?.banner_text;

  return (
    <div className="app-shell">
      <Header
        displayName={profile?.display_name ?? defaultMemberName}
        photoUrl={profile?.avatar_url}
        hasUnreadNotifications={(unreadCount ?? 0) > 0 || unseenAnnouncements > 0}
      />
      {bannerText && <AlertBanner text={bannerText} />}
      <main>{children}</main>
      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}
