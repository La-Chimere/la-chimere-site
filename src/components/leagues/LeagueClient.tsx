"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { LeagueStandingsTable } from "@/components/leagues/LeagueStandingsTable";
import { MatchResultModal } from "@/components/leagues/MatchResultModal";
import { updateParticipantArmy } from "@/lib/league-actions";
import { useT } from "@/components/i18n/LocaleProvider";
import type { League, LeagueMatch } from "@/lib/league-types";

interface LeagueClientProps {
  league: League;
  communityId: string;
  currentUserId: string;
  isOrganizer: boolean;
}

const STATUS_KEYS: Record<League["status"], string> = {
  draft: "league.status.draft",
  active: "league.status.active",
  closed: "league.status.closed",
};

export function LeagueClient({ league, communityId, currentUserId, isOrganizer }: LeagueClientProps) {
  const { t } = useT();
  const [, startTransition] = useTransition();
  const [openMatch, setOpenMatch] = useState<LeagueMatch | null>(null);
  const [armyDraft, setArmyDraft] = useState<string | null>(null);

  const sortedDivisions = useMemo(
    () => [...league.divisions].sort((a, b) => a.rank - b.rank),
    [league.divisions],
  );

  const myDivision = sortedDivisions.find((d) =>
    d.participants.some((p) => p.profileId === currentUserId),
  );
  const myParticipant = myDivision?.participants.find((p) => p.profileId === currentUserId);
  const myPendingMatches =
    myDivision?.matches.filter(
      (m) =>
        m.scoreA === null &&
        (m.playerAId === currentUserId || m.playerBId === currentUserId),
    ) ?? [];
  const myRecap = myDivision?.standings.find((s) => s.profileId === currentUserId);

  function saveArmy() {
    if (!myParticipant || armyDraft === null) return;
    startTransition(() => updateParticipantArmy(myParticipant.id, armyDraft));
    setArmyDraft(null);
  }

  return (
    <div className="page">
      <div className="subpage-back-row">
        <BackButton />
      </div>

      <div className="member-profile-head">
        <div className="member-profile-name">{league.name}</div>
        <div className="member-profile-joined">
          {league.communityLabel} · {t(STATUS_KEYS[league.status])}
        </div>
      </div>

      {isOrganizer && (
        <div className="section-card">
          <Link href={`/communities/${communityId}/leagues/${league.id}/admin`}>
            <Button variant="outline" full>
              {t("league.manageButton")}
            </Button>
          </Link>
        </div>
      )}

      {league.description && (
        <div className="section-card">
          <p className="info-box-text">{league.description}</p>
        </div>
      )}

      {myDivision && (
        <>
          <h1 className="page-title">{t("league.myMatches")}</h1>
          <div className="section-card">
            {myRecap && (
              <div className="lb-row">
                <div className="lb-info">
                  <div className="lb-name">{t("league.myRecord")}</div>
                </div>
                <div className="lb-wdl">
                  <span className="w">{myRecap.wins}</span>
                  <span className="sep">/</span>
                  <span className="d">{myRecap.ties}</span>
                  <span className="sep">/</span>
                  <span className="lo">{myRecap.losses}</span>
                </div>
              </div>
            )}
            {myPendingMatches.length === 0 ? (
              <p className="empty-hint">{t("league.noMatchesLeft")}</p>
            ) : (
              myPendingMatches.map((m) => {
                const opponent = m.playerAId === currentUserId ? m.playerBDisplayName : m.playerADisplayName;
                return (
                  <div className="admin-row" key={m.id}>
                    <span className="name">{t("league.vsOpponent", { name: opponent })}</span>
                    <button type="button" className="join-btn small" onClick={() => setOpenMatch(m)}>
                      {t("league.reportResult")}
                    </button>
                  </div>
                );
              })
            )}

            {myParticipant && (
              <div className="form-field" style={{ marginTop: 14 }}>
                <label className="form-label">{t("league.myArmy")}</label>
                <div className="admin-add-key-row">
                  <input
                    className="form-input"
                    style={{ flex: 1 }}
                    value={armyDraft ?? myParticipant.army ?? ""}
                    onChange={(e) => setArmyDraft(e.target.value)}
                    placeholder={t("league.armyPlaceholder")}
                  />
                  <button
                    type="button"
                    className="join-btn small"
                    disabled={armyDraft === null}
                    onClick={saveArmy}
                  >
                    {t("common.save")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {sortedDivisions.map((division) => (
        <div key={division.id}>
          <h1 className="page-title">{division.name}</h1>
          <div className="section-card">
            {division.standings.length === 0 ? (
              <p className="empty-hint">{t("league.noParticipants")}</p>
            ) : (
              <LeagueStandingsTable
                rows={division.standings}
                highlightProfileId={currentUserId}
                pointsLabel={league.format === "championnat" ? t("league.standings.roundsSurvived") : undefined}
              />
            )}
            {division.participants.some((p) => p.army) && (
              <div className="member-communities" style={{ marginTop: 10 }}>
                {division.participants
                  .filter((p) => p.army)
                  .map((p) => (
                    <span className="tag genre" key={p.id}>
                      {p.displayName} · {p.army}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>
      ))}

      <MatchResultModal match={openMatch} onClose={() => setOpenMatch(null)} />
    </div>
  );
}
