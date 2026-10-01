export interface EventCommunity {
  id: string;
  key: string;
  label: string;
  competitive: boolean;
}

export interface EventParticipant {
  profileId: string;
  displayName: string;
  hasKey: boolean;
  avatarUrl: string | null;
  result: "victoire" | "egalite" | "defaite" | null;
}

export interface EventItem {
  id: string;
  type: "officiel" | "spontane" | "dispo";
  title: string | null;
  description: string | null;
  eventDate: string; // yyyy-MM-dd
  startTime: string; // HH:mm:ss
  endTime: string;
  createdBy: string;
  repeatsWeekly: boolean;
  leagueMatch: LeagueMatchLite | null;
  communities: EventCommunity[];
  participants: EventParticipant[];
}

export interface CommunityOption {
  id: string;
  key: string;
  label: string;
  competitive: boolean;
}

export interface LeagueMatchCandidate {
  matchId: string;
  opponentId: string;
  communityId: string;
  label: string;
}

export interface LeagueMatchLite {
  id: string;
  scoreA: number | null;
  scoreB: number | null;
  playerAId: string;
  playerBId: string;
  proofPath: string | null;
  proofUrl: string | null;
}
