import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("notification_prefs, is_super_admin")
    .eq("id", user.id)
    .single();

  let admins: { id: string; displayName: string }[] = [];
  let nonAdmins: { id: string; displayName: string }[] = [];

  if (profile?.is_super_admin) {
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("id, display_name, is_admin")
      .order("display_name");
    admins = (allProfiles ?? [])
      .filter((p) => p.is_admin)
      .map((p) => ({ id: p.id, displayName: p.display_name }));
    nonAdmins = (allProfiles ?? [])
      .filter((p) => !p.is_admin)
      .map((p) => ({ id: p.id, displayName: p.display_name }));
  }

  return (
    <SettingsClient
      notificationPrefs={(profile?.notification_prefs as Record<string, boolean>) ?? {}}
      isSuperAdmin={profile?.is_super_admin ?? false}
      admins={admins}
      nonAdmins={nonAdmins}
    />
  );
}
