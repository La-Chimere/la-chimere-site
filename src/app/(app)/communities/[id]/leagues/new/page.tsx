import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeagueCreateForm } from "@/components/leagues/LeagueCreateForm";

export default async function LeagueCreatePage(props: PageProps<"/communities/[id]/leagues/new">) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: community }] = await Promise.all([
    supabase.from("profiles").select("is_admin, can_create_leagues").eq("id", user.id).single(),
    supabase.from("communities").select("label").eq("id", id).single(),
  ]);

  if (!profile?.is_admin && !profile?.can_create_leagues) redirect("/communities");
  if (!community) redirect("/communities");

  return <LeagueCreateForm communityId={id} communityLabel={community.label} />;
}
