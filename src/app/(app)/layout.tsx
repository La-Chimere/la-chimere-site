import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/ui/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { signOut } from "@/lib/auth-actions";
import { serverT } from "@/lib/i18n/server";

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
    { data: myCommunities },
    { data: announcementAudiences },
    { data: myReads },
    { data: bannerAnnouncement },
  ] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url, is_admin, status").eq("id", user.id).single(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", user.id)
      .eq("read", false),
    supabase.from("profile_communities").select("community_id").eq("profile_id", user.id),
    supabase.from("announcements").select("id, target_community_id"),
    supabase.from("announcement_reads").select("announcement_id").eq("profile_id", user.id),
    supabase.from("announcements").select("banner_text").eq("banner", true).maybeSingle(),
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

  const myCommunityIds = new Set((myCommunities ?? []).map((c) => c.community_id));
  const readIds = new Set((myReads ?? []).map((r) => r.announcement_id));
  const unseenAnnouncements = (announcementAudiences ?? []).filter(
    (a) =>
      (!a.target_community_id || myCommunityIds.has(a.target_community_id)) &&
      !readIds.has(a.id),
  ).length;

  return (
    <div className="app-shell">
      <Header
        displayName={profile?.display_name ?? defaultMemberName}
        photoUrl={profile?.avatar_url}
        hasUnreadNotifications={(unreadCount ?? 0) > 0 || unseenAnnouncements > 0}
      />
      {bannerAnnouncement?.banner_text && <AlertBanner text={bannerAnnouncement.banner_text} />}
      <main>{children}</main>
      <BottomNav isAdmin={profile?.is_admin ?? false} />
    </div>
  );
}
