import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverT } from "@/lib/i18n/server";

function oneOrFirst<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

// Notifie un membre qu'il a été inscrit dans une division de ligue (CDC
// league : notification dans l'onglet Annonces/Notifications existant).
// L'insertion passe par service_role car les notifications n'ont pas de
// policy INSERT pour les clients authentifiés (voir migration 0001) — seule
// cette ligne a besoin du client admin, le reste de l'action appelante reste
// sur le client de session.
export async function notifyLeagueAssignment(divisionId: string, profileId: string) {
  const supabase = await createClient();
  const { data: division } = await supabase
    .from("league_divisions")
    .select("name, leagues(name)")
    .eq("id", divisionId)
    .single();
  if (!division) return;

  const league = oneOrFirst(division.leagues);
  const message = await serverT("league.notif.assigned", {
    division: division.name,
    league: league?.name ?? "",
  });

  const admin = createAdminClient();
  await admin.from("notifications").insert({
    profile_id: profileId,
    type: "league_assignment",
    message,
  });
}
