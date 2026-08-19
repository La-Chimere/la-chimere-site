import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KeysClient } from "@/components/keys/KeysClient";

export default async function KeysPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: settings }, { data: membersData }] = await Promise.all([
    supabase.from("profiles").select("has_key, has_exit_key").eq("id", user.id).single(),
    supabase.from("club_settings").select("building_code").eq("id", 1).single(),
    supabase.from("profiles").select("id, display_name").neq("id", user.id).eq("has_key", false).order("display_name"),
  ]);

  return (
    <KeysClient
      hasKey={profile?.has_key ?? false}
      hasExitKey={profile?.has_exit_key ?? false}
      buildingCode={settings?.building_code ?? null}
      otherMembers={(membersData ?? []).map((m) => ({ id: m.id, displayName: m.display_name }))}
    />
  );
}
