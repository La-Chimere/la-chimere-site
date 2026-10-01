"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyLeagueAssignment } from "@/lib/notify-league";
import { serverT } from "@/lib/i18n/server";
import type { LeagueFormat } from "@/lib/league-types";

function oneOrFirst<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");
  return { supabase, userId: user.id };
}

export interface CreateLeagueInput {
  communityId: string;
  name: string;
  format: LeagueFormat;
  pointsWin: number;
  pointsTie: number;
  pointsLoss: number;
}

// Crée la ligue et ajoute aussitôt son créateur comme organisateur (RLS
// league_organizers_insert ne l'autorise que pour une ligue qu'il vient lui-
// même de créer — voir migration 0013).
export async function createLeague(input: CreateLeagueInput) {
  const { supabase, userId } = await requireUserId();

  const { data: league, error } = await supabase
    .from("leagues")
    .insert({
      community_id: input.communityId,
      name: input.name,
      format: input.format,
      points_win: input.pointsWin,
      points_tie: input.pointsTie,
      points_loss: input.pointsLoss,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !league) {
    return { error: error?.message ?? (await serverT("league.error.createFailed")), id: null };
  }

  await supabase.from("league_organizers").insert({ league_id: league.id, profile_id: userId });

  revalidatePath("/communities");
  return { error: null, id: league.id as string };
}

export async function setLeagueStatus(leagueId: string, status: "draft" | "active" | "closed") {
  const { supabase } = await requireUserId();
  await supabase.from("leagues").update({ status }).eq("id", leagueId);
  revalidatePath("/communities");
}

export async function updateLeaguePoints(
  leagueId: string,
  points: { pointsWin: number; pointsTie: number; pointsLoss: number },
) {
  const { supabase } = await requireUserId();
  await supabase
    .from("leagues")
    .update({ points_win: points.pointsWin, points_tie: points.pointsTie, points_loss: points.pointsLoss })
    .eq("id", leagueId);
  revalidatePath("/communities");
}

export async function deleteLeague(leagueId: string) {
  const { supabase } = await requireUserId();
  await supabase.from("leagues").delete().eq("id", leagueId);
  revalidatePath("/communities");
}

export async function createDivision(leagueId: string, name: string, rank: number) {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("league_divisions")
    .insert({ league_id: leagueId, name, rank })
    .select("id")
    .single();
  revalidatePath("/communities");
  return { error: error?.message ?? null, id: data?.id as string | undefined };
}

// Règlement en texte libre, un seul par ligue (pas par division) — lecture
// seule pour les participants, modifiable à tout moment par l'organisateur.
export async function updateLeagueDescription(leagueId: string, description: string) {
  const { supabase } = await requireUserId();
  await supabase.from("leagues").update({ description: description || null }).eq("id", leagueId);
  revalidatePath("/communities");
}

export async function deleteDivision(divisionId: string) {
  const { supabase } = await requireUserId();
  await supabase.from("league_divisions").delete().eq("id", divisionId);
  revalidatePath("/communities");
}

// Ajoute un membre à une division et le notifie (CDC league : notification
// dans l'onglet existant). Pas d'effet si déjà inscrit (unique(division_id,
// profile_id)) — l'erreur de contrainte est silencieusement ignorée.
export async function assignParticipant(divisionId: string, profileId: string) {
  const { supabase } = await requireUserId();
  const { error } = await supabase
    .from("league_participants")
    .insert({ division_id: divisionId, profile_id: profileId });
  if (!error) {
    await notifyLeagueAssignment(divisionId, profileId);
  }
  revalidatePath("/communities");
}

export async function removeParticipant(participantId: string) {
  const { supabase } = await requireUserId();
  await supabase.from("league_participants").delete().eq("id", participantId);
  revalidatePath("/communities");
}

// Le joueur choisit/modifie son armée pour la saison (RLS : lui-même ou
// l'organisateur). CDC league : figée une fois la ligue passée en "active"
// côté UI (pas une contrainte base, un draft reste modifiable librement).
export async function updateParticipantArmy(participantId: string, army: string) {
  const { supabase } = await requireUserId();
  await supabase.from("league_participants").update({ army: army || null }).eq("id", participantId);
  revalidatePath("/communities");
}

// Génère tous les matchs d'une poule (round-robin complet) en une fois — ne
// fait rien si des matchs existent déjà pour cette division (évite les
// doublons si l'organisateur re-clique par erreur).
export async function generateRoundRobin(divisionId: string) {
  const { supabase } = await requireUserId();

  const { count } = await supabase
    .from("league_matches")
    .select("id", { count: "exact", head: true })
    .eq("division_id", divisionId);
  if ((count ?? 0) > 0) {
    return { error: await serverT("league.error.matchesAlreadyGenerated") };
  }

  const { data: participants } = await supabase
    .from("league_participants")
    .select("profile_id")
    .eq("division_id", divisionId);
  const ids = (participants ?? []).map((p) => p.profile_id);
  if (ids.length < 2) {
    return { error: await serverT("league.error.notEnoughParticipants") };
  }

  const pairs: { division_id: string; player_a_id: string; player_b_id: string }[] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      pairs.push({ division_id: divisionId, player_a_id: ids[i], player_b_id: ids[j] });
    }
  }
  await supabase.from("league_matches").insert(pairs);

  revalidatePath("/communities");
  return { error: null };
}

// Génère le round suivant pour les formats "suisse"/"championnat" — refuse
// si le round en cours a encore un score manquant. Suisse : tout le monde
// reste éligible à chaque round, apparié par score actuel en évitant les
// rematches (replie sur un rematch si inévitable, improbable à cette
// échelle) ; impair = un joueur ne joue pas ce round (pas de points perdus
// ni gagnés). Championnat : seuls les vainqueurs (+ ceux qui ont eu un bye)
// du round précédent sont réappariés ; impair = bye qualificatif direct.
export async function generateNextRound(divisionId: string) {
  const { supabase } = await requireUserId();

  const [{ data: division }, { data: participantsData }, { data: matchesData }] = await Promise.all([
    supabase.from("league_divisions").select("leagues(format)").eq("id", divisionId).single(),
    supabase.from("league_participants").select("profile_id").eq("division_id", divisionId),
    supabase
      .from("league_matches")
      .select("player_a_id, player_b_id, score_a, score_b, round")
      .eq("division_id", divisionId),
  ]);

  const format = division ? oneOrFirst(division.leagues)?.format : null;
  if (format !== "suisse" && format !== "championnat") {
    return { error: await serverT("league.error.notRoundBased") };
  }

  const matches = matchesData ?? [];
  const ids = (participantsData ?? []).map((p) => p.profile_id);
  const currentRound = matches.reduce((max, m) => Math.max(max, m.round ?? 0), 0);
  const currentRoundMatches = matches.filter((m) => (m.round ?? 0) === currentRound);
  if (currentRound > 0 && currentRoundMatches.some((m) => m.score_a === null)) {
    return { error: await serverT("league.error.roundIncomplete") };
  }

  let pool: string[];
  if (format === "championnat" && currentRound > 0) {
    const losers = new Set<string>();
    for (const m of matches) {
      if (m.score_a === null || m.score_b === null || m.score_a === m.score_b) continue;
      losers.add(m.score_a > m.score_b ? m.player_b_id : m.player_a_id);
    }
    pool = ids.filter((id) => !losers.has(id));
    if (pool.length <= 1) {
      return { error: await serverT("league.error.championshipOver") };
    }
  } else {
    pool = ids;
  }

  let order: string[];
  if (currentRound === 0 || format === "championnat") {
    order = shuffle(pool);
  } else {
    const points = new Map<string, number>(ids.map((id) => [id, 0]));
    for (const m of matches) {
      if (m.score_a === null || m.score_b === null) continue;
      if (m.score_a > m.score_b) points.set(m.player_a_id, (points.get(m.player_a_id) ?? 0) + 1);
      else if (m.score_b > m.score_a) points.set(m.player_b_id, (points.get(m.player_b_id) ?? 0) + 1);
    }
    order = [...pool].sort((a, b) => (points.get(b) ?? 0) - (points.get(a) ?? 0));
  }

  const playedPairs = new Set(matches.map((m) => [m.player_a_id, m.player_b_id].sort().join("|")));
  const remaining = [...order];
  const pairs: { player_a_id: string; player_b_id: string }[] = [];
  while (remaining.length > 1) {
    const a = remaining.shift()!;
    let opponentIndex = remaining.findIndex((b) => !playedPairs.has([a, b].sort().join("|")));
    if (opponentIndex === -1) opponentIndex = 0;
    const b = remaining.splice(opponentIndex, 1)[0];
    pairs.push({ player_a_id: a, player_b_id: b });
  }
  // Un éventuel dernier joueur seul dans `remaining` ne joue pas ce round
  // (suisse) ou avance directement (championnat) — aucun match créé pour lui.

  if (pairs.length === 0) {
    return { error: await serverT("league.error.notEnoughParticipants") };
  }

  await supabase.from("league_matches").insert(
    pairs.map((p) => ({
      division_id: divisionId,
      player_a_id: p.player_a_id,
      player_b_id: p.player_b_id,
      round: currentRound + 1,
    })),
  );

  revalidatePath("/communities");
  return { error: null };
}

// Format "libre" : l'organisateur crée les matchs un par un, à tout moment.
export async function addManualMatch(divisionId: string, playerAId: string, playerBId: string) {
  const { supabase } = await requireUserId();
  if (playerAId === playerBId) {
    return { error: await serverT("league.error.samePlayerTwice") };
  }
  const { error } = await supabase
    .from("league_matches")
    .insert({ division_id: divisionId, player_a_id: playerAId, player_b_id: playerBId });
  revalidatePath("/communities");
  return { error: error?.message ?? null };
}

export async function deleteMatch(matchId: string) {
  const { supabase } = await requireUserId();
  await supabase.from("league_matches").delete().eq("id", matchId);
  revalidatePath("/communities");
}

// Résultat saisi par l'un des deux joueurs ou corrigé par l'organisateur —
// modifiable à tout moment (RLS league_matches_update), y compris pour
// corriger une erreur après coup.
export async function setMatchResult(matchId: string, scoreA: number, scoreB: number) {
  const { supabase, userId } = await requireUserId();
  await supabase
    .from("league_matches")
    .update({ score_a: scoreA, score_b: scoreB, reported_by: userId })
    .eq("id", matchId);
  revalidatePath("/communities");
}

// Le chemin est déjà vérifié par la policy Storage (seuls les deux joueurs
// ou l'organisateur peuvent écrire sous "<matchId>/...") ; ici on se contente
// d'enregistrer le chemin sur la ligne, league_matches_update couvrant déjà
// le droit d'écrire cette colonne.
export async function setMatchProofPath(matchId: string, proofPath: string | null) {
  const { supabase } = await requireUserId();
  await supabase.from("league_matches").update({ proof_path: proofPath }).eq("id", matchId);
  revalidatePath("/communities");
}

export async function clearMatchResult(matchId: string) {
  const { supabase } = await requireUserId();
  await supabase
    .from("league_matches")
    .update({ score_a: null, score_b: null, reported_by: null })
    .eq("id", matchId);
  revalidatePath("/communities");
}
