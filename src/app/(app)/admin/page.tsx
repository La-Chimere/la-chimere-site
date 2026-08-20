import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isoDate } from "@/lib/dates";
import { AdminClient } from "@/components/admin/AdminClient";
import type { AdminCommunity, AdminMember, ClubSettings } from "@/lib/admin-types";

function oneOrFirst<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!myProfile?.is_admin) redirect("/programme");

  const monthStart = isoDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const [
    { data: settingsData },
    { data: profilesData },
    { data: communitiesData },
    { data: activityData },
  ] = await Promise.all([
    supabase.from("club_settings").select("building_code, total_keys, total_exit_keys").eq("id", 1).single(),
    // Toujours TOUS les profils (y compris l'admin connecté) : les compteurs
    // et listes de porteurs de clé du bloc Clés doivent inclure l'admin
    // lui-même, seul le bloc Membres l'exclut de sa propre liste (CDC 12.9).
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url, status, has_key, has_exit_key")
      .order("display_name"),
    supabase.from("communities").select("id, key, label, hidden, competitive").order("label"),
    supabase.from("event_participants").select("profile_id, events(event_date)"),
  ]);

  const lastActivityByProfile = new Map<string, string>();
  const activeThisMonth = new Set<string>();
  for (const row of activityData ?? []) {
    const event = oneOrFirst(row.events);
    if (!event) continue;
    const current = lastActivityByProfile.get(row.profile_id);
    if (!current || event.event_date > current) {
      lastActivityByProfile.set(row.profile_id, event.event_date);
    }
    if (event.event_date >= monthStart) activeThisMonth.add(row.profile_id);
  }

  const allMembers: AdminMember[] = (profilesData ?? []).map((p) => ({
    profileId: p.id,
    displayName: p.display_name,
    avatarUrl: p.avatar_url,
    status: p.status as AdminMember["status"],
    hasKey: p.has_key,
    hasExitKey: p.has_exit_key,
    lastActivity: lastActivityByProfile.get(p.id) ?? null,
  }));
  const membersExcludingSelf = allMembers.filter((m) => m.profileId !== user.id);

  const communities: AdminCommunity[] = (communitiesData ?? []).map((c) => ({
    id: c.id,
    key: c.key,
    label: c.label,
    hidden: c.hidden,
    competitive: c.competitive,
  }));

  const settings: ClubSettings = {
    buildingCode: settingsData?.building_code ?? null,
    totalKeys: settingsData?.total_keys ?? 0,
    totalExitKeys: settingsData?.total_exit_keys ?? 0,
  };

  return (
    <AdminClient
      members={membersExcludingSelf}
      keyHolders={allMembers}
      communities={communities}
      settings={settings}
      activeMembersThisMonth={activeThisMonth.size}
      totalMembers={allMembers.length}
    />
  );
}
