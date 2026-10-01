import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  CommunityLeagueSummary,
  League,
  LeagueDivision,
  LeagueMatch,
  LeagueStandingRow,
} from "@/lib/league-types";

function oneOrFirst<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

// Classement "championnat" (élimination directe) : pas de points cumulés —
// un joueur est éliminé au round où il perd son premier match ; plus il
// tient longtemps (jamais éliminé = encore en lice), mieux il est classé.
// Réutilise le "points" de LeagueStandingRow comme simple clé de tri (round
// d'élimination, ou maxRound+1 si jamais éliminé = encore en lice/vainqueur),
// wins/losses/scoreDiff restent ceux déjà calculés normalement.
function computeBracketStandings(
  participants: { profileId: string }[],
  matches: LeagueMatch[],
  standingsByProfileId: Map<string, LeagueStandingRow>,
): LeagueStandingRow[] {
  const maxRound = matches.reduce((max, m) => Math.max(max, m.round ?? 0), 0);
  const eliminatedRound = new Map<string, number>();
  for (const m of matches) {
    if (m.scoreA === null || m.scoreB === null || m.scoreA === m.scoreB) continue;
    const loserId = m.scoreA > m.scoreB ? m.playerBId : m.playerAId;
    const round = m.round ?? 0;
    const existing = eliminatedRound.get(loserId);
    if (existing === undefined || round > existing) eliminatedRound.set(loserId, round);
  }

  for (const p of participants) {
    const row = standingsByProfileId.get(p.profileId);
    if (!row) continue;
    row.points = eliminatedRound.get(p.profileId) ?? maxRound + 1;
  }

  return Array.from(standingsByProfileId.values()).sort(
    (a, b) => b.points - a.points || b.scoreDiff - a.scoreDiff,
  );
}

// Charge une ligue complète (divisions, participants, matchs, classement
// calculé à la volée) — réutilisé par la vue publique/joueur et la vue
// organisateur, qui ont toutes les deux besoin exactement des mêmes données.
export async function loadLeague(leagueId: string): Promise<League | null> {
  const supabase = await createClient();

  const [{ data: leagueRow }, { data: divisionsData }, { data: organizersData }] = await Promise.all([
    supabase
      .from("leagues")
      .select(
        "id, community_id, name, format, status, points_win, points_tie, points_loss, created_by, communities(label)",
      )
      .eq("id", leagueId)
      .single(),
    supabase
      .from("league_divisions")
      .select(
        `id, name, rank, rules,
        league_participants(id, profile_id, army, profiles(display_name, avatar_url)),
        league_matches(id, player_a_id, player_b_id, score_a, score_b, proof_path, round)`,
      )
      .eq("league_id", leagueId)
      .order("rank"),
    supabase.from("league_organizers").select("profile_id").eq("league_id", leagueId),
  ]);

  if (!leagueRow) return null;

  const community = oneOrFirst(leagueRow.communities);

  const divisions: LeagueDivision[] = (divisionsData ?? []).map((d) => {
    const participants = (d.league_participants ?? [])
      .map((p) => ({ ...p, profiles: oneOrFirst(p.profiles) }))
      .filter((p) => p.profiles)
      .map((p) => ({
        id: p.id,
        profileId: p.profile_id,
        displayName: p.profiles!.display_name,
        avatarUrl: p.profiles!.avatar_url,
        army: p.army,
      }));

    const nameByProfileId = new Map(participants.map((p) => [p.profileId, p.displayName]));

    const matches: LeagueMatch[] = (d.league_matches ?? []).map((m) => ({
      id: m.id,
      divisionId: d.id,
      playerAId: m.player_a_id,
      playerBId: m.player_b_id,
      playerADisplayName: nameByProfileId.get(m.player_a_id) ?? "?",
      playerBDisplayName: nameByProfileId.get(m.player_b_id) ?? "?",
      scoreA: m.score_a,
      scoreB: m.score_b,
      proofPath: m.proof_path,
      proofUrl: null,
      round: m.round,
    }));

    const standingsByProfileId = new Map<string, LeagueStandingRow>();
    for (const p of participants) {
      standingsByProfileId.set(p.profileId, {
        profileId: p.profileId,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
        played: 0,
        wins: 0,
        ties: 0,
        losses: 0,
        points: 0,
        scoreDiff: 0,
      });
    }
    for (const m of matches) {
      if (m.scoreA === null || m.scoreB === null) continue;
      const rowA = standingsByProfileId.get(m.playerAId);
      const rowB = standingsByProfileId.get(m.playerBId);
      if (!rowA || !rowB) continue;
      rowA.played += 1;
      rowB.played += 1;
      rowA.scoreDiff += m.scoreA - m.scoreB;
      rowB.scoreDiff += m.scoreB - m.scoreA;
      if (m.scoreA > m.scoreB) {
        rowA.wins += 1;
        rowA.points += leagueRow.points_win;
        rowB.losses += 1;
        rowB.points += leagueRow.points_loss;
      } else if (m.scoreA < m.scoreB) {
        rowB.wins += 1;
        rowB.points += leagueRow.points_win;
        rowA.losses += 1;
        rowA.points += leagueRow.points_loss;
      } else {
        rowA.ties += 1;
        rowB.ties += 1;
        rowA.points += leagueRow.points_tie;
        rowB.points += leagueRow.points_tie;
      }
    }

    // Championnat (élimination directe) : le classement n'a rien à voir avec
    // des points cumulés — un joueur est éliminé au round où il perd son
    // premier match, et "tient" d'autant plus longtemps qu'il est placé
    // haut (podium de bracket demandé explicitement, pas un barème à points).
    const standings =
      leagueRow.format === "championnat"
        ? computeBracketStandings(participants, matches, standingsByProfileId)
        : Array.from(standingsByProfileId.values()).sort(
            (a, b) => b.points - a.points || b.scoreDiff - a.scoreDiff,
          );

    return {
      id: d.id,
      name: d.name,
      rank: d.rank,
      rules: d.rules,
      participants,
      matches,
      standings,
    };
  });

  // URLs signées pour les preuves photo : échoue silencieusement (reste
  // null) si le visiteur courant n'a pas le droit de lire cet objet côté
  // Storage (RLS) — c'est exactement le comportement voulu (visible
  // seulement des deux joueurs et de l'organisateur).
  const matchesWithProof = divisions.flatMap((d) => d.matches).filter((m) => m.proofPath);
  if (matchesWithProof.length > 0) {
    const signed = await Promise.all(
      matchesWithProof.map((m) =>
        supabase.storage.from("league-match-proofs").createSignedUrl(m.proofPath!, 3600),
      ),
    );
    signed.forEach((result, i) => {
      matchesWithProof[i].proofUrl = result.data?.signedUrl ?? null;
    });
  }

  return {
    id: leagueRow.id,
    communityId: leagueRow.community_id,
    communityLabel: community?.label ?? "",
    name: leagueRow.name,
    format: leagueRow.format as League["format"],
    status: leagueRow.status as League["status"],
    pointsWin: leagueRow.points_win,
    pointsTie: leagueRow.points_tie,
    pointsLoss: leagueRow.points_loss,
    createdBy: leagueRow.created_by,
    divisions,
    organizerIds: (organizersData ?? []).map((o) => o.profile_id),
  };
}

// Résumé par communauté pour l'encart de la page Communautés — une seule
// ligue non-fermée prise en compte par communauté (la plus récente), ne
// recalcule pas le classement complet (pas nécessaire ici).
export async function loadCommunityLeagueSummaries(
  userId: string,
  isAdmin: boolean,
): Promise<Record<string, CommunityLeagueSummary>> {
  const supabase = await createClient();

  const [{ data: leaguesData }, { data: myOrganizerRows }] = await Promise.all([
    supabase
      .from("leagues")
      .select(
        `id, community_id, name, created_at,
        league_divisions(league_participants(profile_id),
          league_matches(player_a_id, player_b_id, score_a, score_b))`,
      )
      .neq("status", "closed")
      .order("created_at", { ascending: false }),
    supabase.from("league_organizers").select("league_id").eq("profile_id", userId),
  ]);

  const myOrganizerLeagueIds = new Set((myOrganizerRows ?? []).map((r) => r.league_id));
  const result: Record<string, CommunityLeagueSummary> = {};

  for (const league of leaguesData ?? []) {
    // La plus récente ligue non-fermée déjà vue l'emporte pour cette communauté.
    if (result[league.community_id]) continue;

    const divisions = league.league_divisions ?? [];
    const matches = divisions.flatMap((d) => d.league_matches ?? []);
    const isParticipant = divisions.some((d) =>
      (d.league_participants ?? []).some((p) => p.profile_id === userId),
    );

    let myPendingMatches = 0;
    const myRecord = { wins: 0, ties: 0, losses: 0 };
    let anyMyMatch = false;
    for (const m of matches) {
      const isMine = m.player_a_id === userId || m.player_b_id === userId;
      if (!isMine) continue;
      anyMyMatch = true;
      if (m.score_a === null || m.score_b === null) {
        myPendingMatches += 1;
        continue;
      }
      const myScore = m.player_a_id === userId ? m.score_a : m.score_b;
      const theirScore = m.player_a_id === userId ? m.score_b : m.score_a;
      if (myScore > theirScore) myRecord.wins += 1;
      else if (myScore < theirScore) myRecord.losses += 1;
      else myRecord.ties += 1;
    }

    const pendingMatches = matches.filter((m) => m.score_a === null).length;

    result[league.community_id] = {
      leagueId: league.id,
      leagueName: league.name,
      isParticipant,
      isOrganizer: isAdmin || myOrganizerLeagueIds.has(league.id),
      myPendingMatches,
      myRecord: anyMyMatch ? myRecord : null,
      totalMatches: matches.length,
      pendingMatches,
      completionPct:
        matches.length === 0 ? 0 : Math.round(((matches.length - pendingMatches) / matches.length) * 100),
    };
  }

  return result;
}
