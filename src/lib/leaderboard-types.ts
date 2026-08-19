export interface LeaderboardRow {
  profileId: string;
  displayName: string;
  avatarUrl: string | null;
  games: number;
  wins: number;
  ties: number;
  losses: number;
}

export interface LeaderboardData {
  rows: LeaderboardRow[];
  membersThisWeek: number;
  eventsThisWeek: number;
  /** faux si la communauté sélectionnée n'est pas compétitive (CDC 12.9) : cache les colonnes V/E/D. */
  competitive: boolean;
}
