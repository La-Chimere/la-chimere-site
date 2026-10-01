import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadLeague } from "@/lib/league-loader";
import { LeagueClient } from "@/components/leagues/LeagueClient";
import { BackButton } from "@/components/ui/BackButton";
import { serverT } from "@/lib/i18n/server";

// Aperçu de ligue ouvert à tout membre connecté (curieux d'une autre
// communauté inclus) ; les sections "mes matchs"/"mon armée" ne s'affichent
// que si le visiteur participe lui-même (voir LeagueClient).
export default async function LeaguePage(props: PageProps<"/communities/[id]/leagues/[leagueId]">) {
  const { id, leagueId } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const league = await loadLeague(leagueId);
  if (!league) {
    return (
      <div className="page">
        <div className="subpage-back-row">
          <BackButton />
        </div>
        <p className="empty-hint">{await serverT("league.notFound")}</p>
      </div>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  const isOrganizer = (profile?.is_admin ?? false) || league.organizerIds.includes(user.id);

  return (
    <LeagueClient league={league} communityId={id} currentUserId={user.id} isOrganizer={isOrganizer} />
  );
}
