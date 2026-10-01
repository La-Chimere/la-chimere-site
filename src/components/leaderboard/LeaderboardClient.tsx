"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { AvatarCircle } from "@/components/ui/AvatarCircle";
import { useT } from "@/components/i18n/LocaleProvider";
import { shortDate } from "@/lib/dates";
import type { CommunityOption } from "@/lib/events-types";
import type { LeaderboardData } from "@/lib/leaderboard-types";
import type { CommunityLeagueSummary } from "@/lib/league-types";

interface LeaderboardClientProps {
  communities: CommunityOption[];
  dataByFilter: Record<string, LeaderboardData>;
  leagueSummaries: Record<string, CommunityLeagueSummary>;
  canCreateLeagues: boolean;
}

type SortKey = "games" | "wdl";

const RANK_CLASS = ["top1", "top2", "top3"] as const;

function dash(n: number): string {
  return n === 0 ? "-" : String(n);
}

// Classement (CDC 4.4/12.7) : filtre par communauté, deux colonnes triables,
// colonnes V/E/D masquées si la communauté sélectionnée n'est pas
// compétitive, liste plafonnée à 10 membres.
export function LeaderboardClient({
  communities,
  dataByFilter,
  leagueSummaries,
  canCreateLeagues,
}: LeaderboardClientProps) {
  const { t } = useT();
  const [filter, setFilter] = useState<string>("tous");
  const [sortKey, setSortKey] = useState<SortKey>("games");

  const data = dataByFilter[filter] ?? dataByFilter.tous;
  const effectiveSortKey = data.competitive ? sortKey : "games";

  const sortedRows = useMemo(() => {
    const rows = [...data.rows];
    if (effectiveSortKey === "games") {
      rows.sort((a, b) => b.games - a.games);
    } else {
      rows.sort((a, b) => b.wins - a.wins || b.ties - a.ties || a.losses - b.losses);
    }
    return rows.slice(0, 10);
  }, [data.rows, effectiveSortKey]);

  return (
    <div className="page">
      <div className="filters h-scroll">
        <Chip variant="outline" active={filter === "tous"} onClick={() => setFilter("tous")}>
          {t("common.all")}
        </Chip>
        {communities.map((c) => (
          <Chip
            key={c.id}
            variant="outline"
            active={filter === c.id}
            onClick={() => setFilter(c.id)}
          >
            {c.label}
          </Chip>
        ))}
      </div>

      {filter !== "tous" && leagueSummaries[filter] && (
        <div className="section-card">
          {(() => {
            const summary = leagueSummaries[filter];
            return (
              <>
                <h2 className="section-subtitle">{summary.leagueName}</h2>
                {summary.resultsDeadline && (
                  <p className="field-note">
                    {t("league.widget.deadline", { date: shortDate(summary.resultsDeadline) })}
                  </p>
                )}
                {summary.isOrganizer ? (
                  <>
                    <div className="form-label">{t("league.admin.completion", { pct: summary.completionPct })}</div>
                    <div className="league-progress-track">
                      <div className="league-progress-fill" style={{ width: `${summary.completionPct}%` }} />
                    </div>
                  </>
                ) : summary.isParticipant ? (
                  <>
                    <p className="field-note">{t("league.widget.myMatchesToPlay", { n: summary.myPendingMatches })}</p>
                    {summary.myRecord && (
                      <div className="lb-wdl" style={{ margin: "6px 0" }}>
                        <span className="w">{summary.myRecord.wins}</span>
                        <span className="sep">/</span>
                        <span className="d">{summary.myRecord.ties}</span>
                        <span className="sep">/</span>
                        <span className="lo">{summary.myRecord.losses}</span>
                      </div>
                    )}
                  </>
                ) : null}
                <Link href={`/communities/${filter}/leagues/${summary.leagueId}${summary.isOrganizer ? "/admin" : ""}`}>
                  <Button variant="outline" full style={{ marginTop: 10 }}>
                    {summary.isOrganizer ? t("league.manageButton") : t("league.viewButton")}
                  </Button>
                </Link>
              </>
            );
          })()}
        </div>
      )}
      {filter !== "tous" && !leagueSummaries[filter] && canCreateLeagues && (
        <div className="section-card">
          <Link href={`/communities/${filter}/leagues/new`}>
            <Button variant="outline" full>
              {t("league.createButton")}
            </Button>
          </Link>
        </div>
      )}

      <div className="admin-stats">
        <div className="section-card admin-stat">
          <span className="n">{data.membersThisWeek}</span>
          <span className="l">{t("leaderboard.membersThisWeek")}</span>
        </div>
        <div className="section-card admin-stat">
          <span className="n">{data.eventsThisWeek}</span>
          <span className="l">{t("leaderboard.eventsThisWeek")}</span>
        </div>
      </div>

      <h1 className="page-title">{t("leaderboard.title")}</h1>

      <div className="section-card">
        <div className="lb-header">
          <div className="lb-header-spacer" />
          <button
            type="button"
            className={`lb-col-label ${effectiveSortKey === "games" ? "active" : ""}`}
            onClick={() => setSortKey("games")}
          >
            {t("leaderboard.gamesPlayed")}
          </button>
          {data.competitive && (
            <button
              type="button"
              className={`lb-col-label wdl ${effectiveSortKey === "wdl" ? "active" : ""}`}
              onClick={() => setSortKey("wdl")}
            >
              {t("leaderboard.wtl")}
            </button>
          )}
        </div>

        {sortedRows.length === 0 ? (
          <p className="empty-hint">{t("leaderboard.noGames")}</p>
        ) : (
          sortedRows.map((row, i) => (
            <div className="lb-row" key={row.profileId}>
              <span className={`lb-rank ${RANK_CLASS[i] ?? ""}`}>{i + 1}</span>
              <AvatarCircle name={row.displayName} photoUrl={row.avatarUrl} size="sm" />
              <div className="lb-info">
                <div className="lb-name">{row.displayName}</div>
              </div>
              <div className="lb-stats">
                <span className="n">{row.games}</span>
                <span className="l">{t("leaderboard.sessionsShort")}</span>
              </div>
              {data.competitive && (
                <div className="lb-wdl">
                  <span className="w">{dash(row.wins)}</span>
                  <span className="sep">/</span>
                  <span className="d">{dash(row.ties)}</span>
                  <span className="sep">/</span>
                  <span className="lo">{dash(row.losses)}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
