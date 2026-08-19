"use client";

import { useMemo, useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { AvatarCircle } from "@/components/ui/AvatarCircle";
import type { CommunityOption } from "@/lib/events-types";
import type { LeaderboardData } from "@/lib/leaderboard-types";

interface LeaderboardClientProps {
  communities: CommunityOption[];
  dataByFilter: Record<string, LeaderboardData>;
}

type SortKey = "games" | "wdl";

const RANK_CLASS = ["top1", "top2", "top3"] as const;

function dash(n: number): string {
  return n === 0 ? "-" : String(n);
}

// Classement (CDC 4.4/12.7) : filtre par communauté, deux colonnes triables,
// colonnes V/E/D masquées si la communauté sélectionnée n'est pas
// compétitive, liste plafonnée à 10 membres.
export function LeaderboardClient({ communities, dataByFilter }: LeaderboardClientProps) {
  const [filter, setFilter] = useState<string>("tous");
  const [sortKey, setSortKey] = useState<SortKey>("games");

  const data = dataByFilter[filter] ?? dataByFilter.tous;

  const sortedRows = useMemo(() => {
    const rows = [...data.rows];
    if (sortKey === "games") {
      rows.sort((a, b) => b.games - a.games);
    } else {
      rows.sort((a, b) => b.wins - a.wins || b.ties - a.ties || a.losses - b.losses);
    }
    return rows.slice(0, 10);
  }, [data.rows, sortKey]);

  return (
    <div className="page">
      <div className="filters h-scroll">
        <Chip variant="outline" active={filter === "tous"} onClick={() => setFilter("tous")}>
          Tous
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

      <h1 className="page-title">Classement</h1>

      <div className="admin-stats">
        <div className="section-card admin-stat">
          <span className="n">{data.membersThisWeek}</span>
          <span className="l">membres passés au local cette semaine</span>
        </div>
        <div className="section-card admin-stat">
          <span className="n">{data.eventsThisWeek}</span>
          <span className="l">parties ou évènements cette semaine</span>
        </div>
      </div>

      <div className="section-card">
        <div className="lb-header">
          <div className="lb-header-spacer" />
          <button
            type="button"
            className={`lb-col-label ${sortKey === "games" ? "active" : ""}`}
            onClick={() => setSortKey("games")}
          >
            Parties
            <br />
            jouées
          </button>
          {data.competitive && (
            <button
              type="button"
              className={`lb-col-label wdl ${sortKey === "wdl" ? "active" : ""}`}
              onClick={() => setSortKey("wdl")}
            >
              V / E / D
            </button>
          )}
        </div>

        {sortedRows.length === 0 ? (
          <p className="empty-hint">Aucune partie enregistrée pour l&apos;instant.</p>
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
