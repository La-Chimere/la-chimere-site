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
    { data: announcements },
    { data: myReads },
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
    supabase.from("announcements").select("id, target_community_id, banner, banner_text"),
    supabase.from("announcement_reads").select("announcement_id").eq("profile_id", user.id),
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

  const myCommunityIds = new Set((profile?.profile_communities ?? []).map((c) => c.community_id));
  const readIds = new Set((myReads ?? []).map((r) => r.announcement_id));
  const unseenAnnouncements = (announcements ?? []).filter(
    (a) =>
      (!a.target_community_id || myCommunityIds.has(a.target_community_id)) &&
      !readIds.has(a.id),
  ).length;
  const bannerText = (announcements ?? []).find((a) => a.banner)?.banner_text;

  return (
    <div className="app-shell">
      <Header
        displayName={profile?.display_name ?? defaultMemberName}
        photoUrl={profile?.avatar_url}
        hasUnreadNotifications={(unreadCount ?? 0) > 0 || unseenAnnouncements > 0}
      />
      {bannerText && <AlertBanner text={bannerText} />}
      <main>{children}</main>
      <BottomNav isAdmin={profile?.is_admin ?? false} />
    </div>
  );
}
