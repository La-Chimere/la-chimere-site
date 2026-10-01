import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadLeague } from "@/lib/league-loader";
import { LeagueAdminClient } from "@/components/leagues/LeagueAdminClient";

// Double vérification serveur du droit d'organisateur (RLS protège déjà les
// mutations, mais on évite d'afficher l'écran de gestion à qui ne devrait
// même pas le voir — même logique que /admin pour is_admin).
export default async function LeagueAdminPage(props: PageProps<"/communities/[id]/leagues/[leagueId]/admin">) {
  const { id, leagueId } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const league = await loadLeague(leagueId);
  if (!league) redirect(`/communities`);

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  const isOrganizer = (profile?.is_admin ?? false) || league.organizerIds.includes(user.id);
  if (!isOrganizer) redirect(`/communities/${id}/leagues/${leagueId}`);

  const { data: membersData } = await supabase
    .from("profile_communities")
    .select("profiles(id, display_name)")
    .eq("community_id", league.communityId);

  function oneOrFirst<T>(value: T | T[] | null): T | null {
    return Array.isArray(value) ? (value[0] ?? null) : value;
  }

  const communityMembers = (membersData ?? [])
    .map((m) => oneOrFirst(m.profiles))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({ id: p.id, displayName: p.display_name }));

  return (
    <LeagueAdminClient league={league} communityId={id} communityMembers={communityMembers} />
  );
}
