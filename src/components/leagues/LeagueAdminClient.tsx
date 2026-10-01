"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { Chip } from "@/components/ui/Chip";
import { DangerConfirmButton } from "@/components/ui/DangerConfirmButton";
import type { PickableMember } from "@/components/ui/MemberPicker";
import { MatchResultModal } from "@/components/leagues/MatchResultModal";
import { DivisionAdminCard } from "@/components/leagues/DivisionAdminCard";
import { AnnouncementForm } from "@/components/announcements/AnnouncementForm";
import {
  createDivision,
  deleteLeague,
  setLeagueStatus,
  updateLeagueDeadline,
  updateLeagueDescription,
  updateLeaguePoints,
} from "@/lib/league-actions";
import { useT } from "@/components/i18n/LocaleProvider";
import type { League, LeagueMatch, LeagueStatus } from "@/lib/league-types";

interface LeagueAdminClientProps {
  league: League;
  communityId: string;
  communityMembers: PickableMember[];
}

const STATUSES: LeagueStatus[] = ["draft", "active", "closed"];
const STATUS_KEYS: Record<LeagueStatus, string> = {
  draft: "league.status.draft",
  active: "league.status.active",
  closed: "league.status.closed",
};

export function LeagueAdminClient({ league, communityId, communityMembers }: LeagueAdminClientProps) {
  const { t } = useT();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [openMatch, setOpenMatch] = useState<LeagueMatch | null>(null);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [newDivisionName, setNewDivisionName] = useState("");
  const [points, setPoints] = useState({
    pointsWin: league.pointsWin,
    pointsTie: league.pointsTie,
    pointsLoss: league.pointsLoss,
  });
  const [description, setDescription] = useState(league.description ?? "");
  const [deadline, setDeadline] = useState(league.resultsDeadline ?? "");
  const showPointsScheme = league.format === "poule" || league.format === "libre";

  const sortedDivisions = useMemo(
    () => [...league.divisions].sort((a, b) => a.rank - b.rank),
    [league.divisions],
  );

  const allMatches = useMemo(() => sortedDivisions.flatMap((d) => d.matches), [sortedDivisions]);
  const pendingCount = allMatches.filter((m) => m.scoreA === null).length;
  const completionPct =
    allMatches.length === 0 ? 0 : Math.round(((allMatches.length - pendingCount) / allMatches.length) * 100);

  function savePoints() {
    startTransition(() => updateLeaguePoints(league.id, points));
  }

  function addDivision() {
    if (!newDivisionName.trim()) return;
    startTransition(() => {
      createDivision(league.id, newDivisionName.trim(), sortedDivisions.length + 1);
    });
    setNewDivisionName("");
  }

  return (
    <div className="page">
      <div className="subpage-back-row">
        <BackButton />
      </div>

      <div className="member-profile-head">
        <div className="member-profile-name">{league.name}</div>
        <div className="member-profile-joined">{league.communityLabel}</div>
        <Link href={`/communities/${communityId}/leagues/${league.id}`} className="link-btn">
          {t("league.viewButton")}
        </Link>
      </div>

      <div className="section-card">
        <div className="form-label">{t("league.admin.completion", { pct: completionPct })}</div>
        <div className="league-progress-track">
          <div className="league-progress-fill" style={{ width: `${completionPct}%` }} />
        </div>

        <div className="filters" style={{ marginTop: 12 }}>
          {STATUSES.map((s) => (
            <Chip
              key={s}
              active={league.status === s}
              onClick={() => startTransition(() => setLeagueStatus(league.id, s))}
            >
              {t(STATUS_KEYS[s])}
            </Chip>
          ))}
        </div>
      </div>

      <h1 className="page-title">{t("league.admin.divisions")}</h1>
      {sortedDivisions.map((division) => (
        <DivisionAdminCard
          key={division.id}
          league={league}
          division={division}
          communityMembers={communityMembers}
          onOpenMatch={setOpenMatch}
        />
      ))}

      <div className="section-card">
        <div className="form-field">
          <input
            className="form-input"
            value={newDivisionName}
            onChange={(e) => setNewDivisionName(e.target.value)}
            placeholder={t("league.admin.newDivisionPlaceholder")}
          />
        </div>
        <button type="button" className="modal-btn outline modal-btn-full" onClick={addDivision}>
          {t("league.admin.addDivision")}
        </button>
      </div>

      {showPointsScheme && (
        <>
          <h1 className="page-title">{t("league.admin.pointsScheme")}</h1>
          <div className="section-card">
            <div className="form-row-2">
              <div className="form-field">
                <label className="form-label">{t("league.admin.pointsWin")}</label>
                <input
                  type="number"
                  className="form-input"
                  value={points.pointsWin}
                  onChange={(e) => setPoints((p) => ({ ...p, pointsWin: Number(e.target.value) }))}
                  onBlur={savePoints}
                />
              </div>
              <div className="form-field">
                <label className="form-label">{t("league.admin.pointsTie")}</label>
                <input
                  type="number"
                  className="form-input"
                  value={points.pointsTie}
                  onChange={(e) => setPoints((p) => ({ ...p, pointsTie: Number(e.target.value) }))}
                  onBlur={savePoints}
                />
              </div>
              <div className="form-field">
                <label className="form-label">{t("league.admin.pointsLoss")}</label>
                <input
                  type="number"
                  className="form-input"
                  value={points.pointsLoss}
                  onChange={(e) => setPoints((p) => ({ ...p, pointsLoss: Number(e.target.value) }))}
                  onBlur={savePoints}
                />
              </div>
            </div>
          </div>
        </>
      )}

      <h1 className="page-title">{t("league.admin.announce")}</h1>
      <div className="section-card">
        <button type="button" className="modal-btn primary modal-btn-full" onClick={() => setAnnouncementOpen(true)}>
          {t("league.admin.announceButton")}
        </button>
      </div>

      <h1 className="page-title">{t("league.admin.description")}</h1>
      <div className="section-card">
        <div className="form-field">
          <label className="form-label">{t("league.admin.deadline")}</label>
          <input
            type="date"
            className="form-input"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            onBlur={() => startTransition(() => updateLeagueDeadline(league.id, deadline))}
          />
        </div>
        <textarea
          className="form-input form-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => startTransition(() => updateLeagueDescription(league.id, description))}
          placeholder={t("league.admin.descriptionPlaceholder")}
        />
      </div>

      <h1 className="page-title">{t("settings.account")}</h1>
      <div className="section-card">
        <DangerConfirmButton
          className="modal-btn danger modal-btn-full"
          onConfirm={() => {
            startTransition(async () => {
              const result = await deleteLeague(league.id);
              if (result.error) {
                setDeleteError(result.error);
                return;
              }
              router.push(`/communities`);
            });
          }}
        >
          {t("league.admin.deleteLeague")}
        </DangerConfirmButton>
        {deleteError && <p className="field-error">{deleteError}</p>}
      </div>

      <MatchResultModal match={openMatch} onClose={() => setOpenMatch(null)} />
      <AnnouncementForm
        open={announcementOpen}
        onClose={() => setAnnouncementOpen(false)}
        communities={[]}
        editing={null}
        fixedLeagueTarget={{ id: league.id, label: league.name }}
      />
    </div>
  );
}
