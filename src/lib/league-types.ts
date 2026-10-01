export type LeagueFormat = "poule" | "libre" | "suisse" | "championnat";
export type LeagueStatus = "draft" | "active" | "closed";

export interface LeagueParticipant {
  id: string;
  profileId: string;
  displayName: string;
  avatarUrl: string | null;
  army: string | null;
}

export interface LeagueMatch {
  id: string;
  divisionId: string;
  playerAId: string;
  playerBId: string;
  playerADisplayName: string;
  playerBDisplayName: string;
  scoreA: number | null;
  scoreB: number | null;
  round: number | null;
  proofPath: string | null;
  /** URL signée (courte durée), générée côté serveur uniquement si le
   * visiteur courant a le droit de voir cette preuve (RLS Storage). */
  proofUrl: string | null;
}

export interface LeagueStandingRow {
  profileId: string;
  displayName: string;
  avatarUrl: string | null;
  played: number;
  wins: number;
  ties: number;
  losses: number;
  points: number;
  scoreDiff: number;
}

export interface LeagueDivision {
  id: string;
  name: string;
  rank: number;
  participants: LeagueParticipant[];
  matches: LeagueMatch[];
  standings: LeagueStandingRow[];
}

export interface League {
  id: string;
  communityId: string;
  communityLabel: string;
  name: string;
  format: LeagueFormat;
  status: LeagueStatus;
  pointsWin: number;
  pointsTie: number;
  pointsLoss: number;
  /** Règlement en texte libre, un seul par ligue (pas par division) —
   * modifiable par l'organisateur, lecture seule pour les participants. */
  description: string | null;
  /** Date limite purement informative (ISO yyyy-MM-dd), aucun impact
   * fonctionnel — juste modifiable par l'organisateur et affichée aux
   * participants. */
  resultsDeadline: string | null;
  createdBy: string;
  divisions: LeagueDivision[];
  organizerIds: string[];
}

export interface LeagueSummary {
  id: string;
  name: string;
  status: LeagueStatus;
}

// Résumé léger affiché dans l'encart de la page Communautés (une seule
// communauté sélectionnée) — volontairement plus simple que League/loadLeague
// (pas besoin du classement complet ni du barème de points ici).
export interface CommunityLeagueSummary {
  leagueId: string;
  leagueName: string;
  resultsDeadline: string | null;
  isParticipant: boolean;
  isOrganizer: boolean;
  myPendingMatches: number;
  myRecord: { wins: number; ties: number; losses: number } | null;
  totalMatches: number;
  pendingMatches: number;
  completionPct: number;
}
