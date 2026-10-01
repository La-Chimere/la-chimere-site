"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";
import { Chip } from "@/components/ui/Chip";
import { DangerConfirmButton } from "@/components/ui/DangerConfirmButton";
import { MemberPicker, type PickableMember } from "@/components/ui/MemberPicker";
import { MatchResultModal } from "@/components/leagues/MatchResultModal";
import { AnnouncementForm } from "@/components/announcements/AnnouncementForm";
import {
  addManualMatch,
  assignParticipant,
  createDivision,
  deleteDivision,
  deleteLeague,
  deleteMatch,
  generateRoundRobin,
  removeParticipant,
  setLeagueStatus,
  updateDivisionRules,
  updateLeaguePoints,
} from "@/lib/league-actions";
import { useT } from "@/components/i18n/LocaleProvider";
import { useRouter } from "next/navigation";
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
  const [newDivisionName, setNewDivisionName] = useState("");
  const [points, setPoints] = useState({
    pointsWin: league.pointsWin,
    pointsTie: league.pointsTie,
    pointsLoss: league.pointsLoss,
  });

  const sortedDivisions = useMemo(
    () => [...league.divisions].sort((a, b) => a.rank - b.rank),
    [league.divisions],
  );

  const allMatches = useMemo(
    () => sortedDivisions.flatMap((d) => d.matches.map((m) => ({ ...m, divisionName: d.name }))),
    [sortedDivisions],
  );
  const pendingMatches = allMatches.filter((m) => m.scoreA === null);
  const completionPct =
    allMatches.length === 0 ? 0 : Math.round(((allMatches.length - pendingMatches.length) / allMatches.length) * 100);

  const assignedProfileIds = useMemo(
    () => new Set(sortedDivisions.flatMap((d) => d.participants.map((p) => p.profileId))),
    [sortedDivisions],
  );
  const availableMembers = communityMembers.filter((m) => !assignedProfileIds.has(m.id));

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

      <h1 className="page-title">{t("league.admin.upcomingMatches")}</h1>
      <div className="section-card">
        {pendingMatches.length === 0 ? (
          <p className="empty-hint">{t("league.admin.noMatchesLeft")}</p>
        ) : (
          pendingMatches.map((m) => (
            <div className="admin-row" key={m.id}>
              <span className="name">
                {m.playerADisplayName} vs {m.playerBDisplayName}
                <span className="sub">{m.divisionName}</span>
              </span>
              <button type="button" className="join-btn small" onClick={() => setOpenMatch(m)}>
                {t("league.reportResult")}
              </button>
            </div>
          ))
        )}
      </div>

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

      <h1 className="page-title">{t("league.admin.announce")}</h1>
      <div className="section-card">
        <button type="button" className="modal-btn primary modal-btn-full" onClick={() => setAnnouncementOpen(true)}>
          {t("league.admin.announceButton")}
        </button>
      </div>

      <h1 className="page-title">{t("league.admin.divisions")}</h1>
      {sortedDivisions.map((division) => {
        const divisionMembers: PickableMember[] = division.participants.map((p) => ({
          id: p.profileId,
          displayName: p.displayName,
        }));
        return (
          <div className="section-card" key={division.id}>
            <div className="an-section-head">
              <h2 className="section-subtitle" style={{ margin: 0 }}>{division.name}</h2>
              <DangerConfirmButton
                className="join-btn danger small"
                onConfirm={() => startTransition(() => deleteDivision(division.id))}
              >
                {t("common.delete")}
              </DangerConfirmButton>
            </div>

            <div className="form-field">
              <label className="form-label">{t("league.admin.rules")}</label>
              <textarea
                className="form-input form-textarea"
                defaultValue={division.rules ?? ""}
                onBlur={(e) => startTransition(() => updateDivisionRules(division.id, e.target.value))}
                placeholder={t("league.admin.rulesPlaceholder")}
              />
            </div>

            <div className="modal-section-label">{t("league.admin.roster")}</div>
            {division.participants.map((p) => (
              <div className="admin-row" key={p.id}>
                <span className="name">
                  {p.displayName}
                  {p.army && <span className="sub">{p.army}</span>}
                </span>
                <button
                  type="button"
                  className="join-btn gray small"
                  onClick={() => startTransition(() => removeParticipant(p.id))}
                >
                  {t("common.remove")}
                </button>
              </div>
            ))}
            <MemberPicker
              members={availableMembers}
              selected={[]}
              onChange={(next) => {
                const added = next[0];
                if (added) startTransition(() => assignParticipant(division.id, added.id));
              }}
              placeholder={t("league.admin.addParticipant")}
              hideSelectedChips
            />

            <div className="modal-section-label" style={{ marginTop: 14 }}>
              {t("league.admin.matches")}
            </div>
            {league.format === "poule" ? (
              division.matches.length === 0 ? (
                <button
                  type="button"
                  className="af-add-option"
                  onClick={() =>
                    startTransition(() => {
                      generateRoundRobin(division.id);
                    })
                  }
                >
                  + {t("league.admin.generateRoundRobin")}
                </button>
              ) : null
            ) : (
              <ManualMatchForm divisionId={division.id} members={divisionMembers} />
            )}
            {division.matches.map((m) => (
              <div className="admin-row" key={m.id}>
                <span className="name">
                  {m.playerADisplayName} vs {m.playerBDisplayName}
                  {m.scoreA !== null && (
                    <span className="sub">
                      {m.scoreA} – {m.scoreB}
                    </span>
                  )}
                </span>
                <span className="admin-row-actions">
                  <button type="button" className="join-btn small" onClick={() => setOpenMatch(m)}>
                    {m.scoreA === null ? t("league.reportResult") : t("common.edit")}
                  </button>
                  <button
                    type="button"
                    className="join-btn gray small"
                    onClick={() => startTransition(() => deleteMatch(m.id))}
                  >
                    {t("common.delete")}
                  </button>
                </span>
              </div>
            ))}
          </div>
        );
      })}

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

      <h1 className="page-title">{t("settings.account")}</h1>
      <div className="section-card">
        <DangerConfirmButton
          className="modal-btn danger modal-btn-full"
          onConfirm={() => {
            startTransition(() => deleteLeague(league.id));
            router.push(`/communities`);
          }}
        >
          {t("league.admin.deleteLeague")}
        </DangerConfirmButton>
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

function ManualMatchForm({ divisionId, members }: { divisionId: string; members: PickableMember[] }) {
  const { t } = useT();
  const [, startTransition] = useTransition();
  const [playerA, setPlayerA] = useState("");
  const [playerB, setPlayerB] = useState("");

  function create() {
    if (!playerA || !playerB || playerA === playerB) return;
    startTransition(() => {
      addManualMatch(divisionId, playerA, playerB);
    });
    setPlayerA("");
    setPlayerB("");
  }

  return (
    <div className="admin-add-key-row">
      <select className="form-input" value={playerA} onChange={(e) => setPlayerA(e.target.value)}>
        <option value="">{t("league.admin.selectPlayer")}</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.displayName}
          </option>
        ))}
      </select>
      <select className="form-input" value={playerB} onChange={(e) => setPlayerB(e.target.value)}>
        <option value="">{t("league.admin.selectPlayer")}</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.displayName}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="join-btn small"
        disabled={!playerA || !playerB || playerA === playerB}
        onClick={create}
      >
        {t("league.admin.createMatch")}
      </button>
    </div>
  );
}
