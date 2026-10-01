import { createClient } from "@/lib/supabase/server";
import { daysOfWeek, isoDate, monthGridDays } from "@/lib/dates";
import { ProgrammeClient } from "@/components/events/ProgrammeClient";
import type { CommunityOption, EventItem, LeagueMatchCandidate } from "@/lib/events-types";

// Sans types générés depuis le schéma Supabase, le client ne connait pas la
// cardinalité réelle d'une relation "vers le parent" (FK) et l'infère comme
// un tableau ; côté Postgres/PostgREST c'est bien un objet unique à
// l'exécution. Ce petit helper normalise les deux cas.
function oneOrFirst<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default async function ProgrammePage(props: PageProps<"/programme">) {
  const searchParams = await props.searchParams;
  const weekParam = typeof searchParams.week === "string" ? searchParams.week : null;
  const reference = weekParam ? new Date(weekParam) : new Date();
  const week = daysOfWeek(reference);
  // Sert à la fois la liste (semaine) et le calendrier mensuel : la grille du
  // mois est un sur-ensemble qui couvre toujours la semaine affichée.
  const grid = monthGridDays(reference);
  const rangeStart = isoDate(grid[0]);
  const rangeEnd = isoDate(grid[grid.length - 1]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // le layout parent redirige déjà vers /login
  }

  const [
    { data: profile },
    { data: communitiesData },
    { data: eventsData },
    { data: membersData },
    { data: alertData },
    { data: communityMembershipsData },
    { data: pendingMatchesData },
  ] = await Promise.all([
    supabase.from("profiles").select("display_name, is_admin").eq("id", user.id).single(),
    supabase
      .from("communities")
      .select("id, key, label, competitive")
      .eq("hidden", false)
      .order("label"),
    supabase
      .from("events")
      .select(
        `id, type, title, description, event_date, start_time, end_time, created_by, repeats_weekly,
        event_communities(communities(id, key, label, competitive)),
        event_participants(profile_id, result, profiles(display_name, has_key, avatar_url)),
        league_matches(id, player_a_id, player_b_id, score_a, score_b, proof_path)`,
      )
      .gte("event_date", rangeStart)
      .lte("event_date", rangeEnd)
      .order("start_time"),
    supabase.from("profiles").select("id, display_name").order("display_name"),
    supabase
      .from("key_alert_sends")
      .select("event_date, click_count")
      .gte("event_date", rangeStart)
      .lte("event_date", rangeEnd),
    supabase.from("profile_communities").select("community_id"),
    // Mes matchs de ligue pas encore joués ET pas déjà liés à un évènement —
    // candidats pour le toggle "match de ligue" auto-détecté dans EventForm.
    supabase
      .from("league_matches")
      .select(
        `id, player_a_id, player_b_id,
        league_divisions(name, leagues(name, community_id)),
        events(id)`,
      )
      .or(`player_a_id.eq.${user.id},player_b_id.eq.${user.id}`)
      .is("score_a", null),
  ]);

  // Communautés triées par popularité (nombre de membres décroissant) —
  // à égalité, ordre alphabétique pour rester déterministe.
  const memberCountByCommunity = new Map<string, number>();
  for (const row of communityMembershipsData ?? []) {
    memberCountByCommunity.set(row.community_id, (memberCountByCommunity.get(row.community_id) ?? 0) + 1);
  }
  const communities: CommunityOption[] = (communitiesData ?? [])
    .map((c) => ({ id: c.id, key: c.key, label: c.label, competitive: c.competitive }))
    .sort((a, b) => {
      const diff = (memberCountByCommunity.get(b.id) ?? 0) - (memberCountByCommunity.get(a.id) ?? 0);
      return diff !== 0 ? diff : a.label.localeCompare(b.label);
    });

  const events: EventItem[] = (eventsData ?? []).map((e) => {
    const leagueMatchRow = oneOrFirst(e.league_matches);
    return {
    id: e.id,
    type: e.type as EventItem["type"],
    title: e.title,
    description: e.description,
    eventDate: e.event_date,
    startTime: e.start_time,
    endTime: e.end_time,
    createdBy: e.created_by,
    repeatsWeekly: e.repeats_weekly,
    leagueMatch: leagueMatchRow
      ? {
          id: leagueMatchRow.id,
          scoreA: leagueMatchRow.score_a,
          scoreB: leagueMatchRow.score_b,
          playerAId: leagueMatchRow.player_a_id,
          playerBId: leagueMatchRow.player_b_id,
          proofPath: leagueMatchRow.proof_path,
          proofUrl: null,
        }
      : null,
    communities: (e.event_communities ?? [])
      .map((ec) => oneOrFirst(ec.communities))
      .filter((c): c is NonNullable<typeof c> => !!c)
      .map((c) => ({ id: c.id, key: c.key, label: c.label, competitive: c.competitive })),
    // Trié par nom (ordre alphabétique) et non par l'ordre renvoyé par la
    // requête (non garanti, et peut changer après une simple mise à jour du
    // résultat V/E/D d'un participant) — l'ordre affiché doit rester stable.
    participants: (e.event_participants ?? [])
      .map((p) => ({ ...p, profiles: oneOrFirst(p.profiles) }))
      .filter((p) => p.profiles)
      .sort((a, b) => a.profiles!.display_name.localeCompare(b.profiles!.display_name))
      .map((p) => ({
        profileId: p.profile_id,
        displayName: p.profiles!.display_name,
        hasKey: p.profiles!.has_key,
        avatarUrl: p.profiles!.avatar_url,
        result: p.result as EventItem["participants"][number]["result"],
      })),
    };
  });

  // URLs signées pour les preuves de match liées à un évènement affiché
  // cette semaine/ce mois — même logique que league-loader.ts (échoue
  // silencieusement si le visiteur n'a pas le droit de lire l'objet).
  const eventsWithProof = events.filter((e) => e.leagueMatch?.proofPath);
  if (eventsWithProof.length > 0) {
    const signed = await Promise.all(
      eventsWithProof.map((e) =>
        supabase.storage.from("league-match-proofs").createSignedUrl(e.leagueMatch!.proofPath!, 3600),
      ),
    );
    signed.forEach((result, i) => {
      eventsWithProof[i].leagueMatch!.proofUrl = result.data?.signedUrl ?? null;
    });
  }

  const myPendingLeagueMatches: LeagueMatchCandidate[] = (pendingMatchesData ?? [])
    .filter((m) => (m.events ?? []).length === 0)
    .map((m) => {
      const division = oneOrFirst(m.league_divisions);
      const league = division ? oneOrFirst(division.leagues) : null;
      if (!league) return null;
      const opponentId = m.player_a_id === user.id ? m.player_b_id : m.player_a_id;
      return {
        matchId: m.id,
        opponentId,
        communityId: league.community_id,
        label: `${league.name} — ${division!.name}`,
      };
    })
    .filter((x): x is LeagueMatchCandidate => !!x);

  const members = (membersData ?? []).map((m) => ({ id: m.id, displayName: m.display_name }));
  const currentUser = { id: user.id, displayName: profile?.display_name ?? "Moi" };

  const alertCounts: Record<string, number> = {};
  for (const row of alertData ?? []) {
    alertCounts[row.event_date] = row.click_count;
  }

  return (
    <ProgrammeClient
      reference={isoDate(reference)}
      days={week.map(isoDate)}
      events={events}
      communities={communities}
      members={members}
      currentUser={currentUser}
      isAdmin={profile?.is_admin ?? false}
      alertCounts={alertCounts}
      myPendingLeagueMatches={myPendingLeagueMatches}
    />
  );
}
