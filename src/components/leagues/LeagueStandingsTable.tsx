import { AvatarCircle } from "@/components/ui/AvatarCircle";
import type { LeagueStandingRow } from "@/lib/league-types";

interface LeagueStandingsTableProps {
  rows: LeagueStandingRow[];
  highlightProfileId?: string;
}

const RANK_CLASS = ["top1", "top2", "top3"] as const;

// Réutilise les classes du Leaderboard (lb-row/lb-rank/lb-wdl) pour rester
// visuellement cohérent, avec deux colonnes propres aux ligues : points de
// classement et différentiel de score cumulé (départage).
export function LeagueStandingsTable({ rows, highlightProfileId }: LeagueStandingsTableProps) {
  return (
    <div>
      {rows.map((row, i) => (
        <div
          className={`lb-row ${row.profileId === highlightProfileId ? "active" : ""}`}
          key={row.profileId}
        >
          <span className={`lb-rank ${RANK_CLASS[i] ?? ""}`}>{i + 1}</span>
          <AvatarCircle name={row.displayName} photoUrl={row.avatarUrl} size="sm" />
          <div className="lb-info">
            <div className="lb-name">{row.displayName}</div>
          </div>
          <div className="lb-stats">
            <span className="n">{row.points}</span>
            <span className="l">pts</span>
          </div>
          <div className="lb-wdl">
            <span className="w">{row.wins}</span>
            <span className="sep">/</span>
            <span className="d">{row.ties}</span>
            <span className="sep">/</span>
            <span className="lo">{row.losses}</span>
          </div>
          <span className="lb-diff">{row.scoreDiff > 0 ? `+${row.scoreDiff}` : row.scoreDiff}</span>
        </div>
      ))}
    </div>
  );
}
