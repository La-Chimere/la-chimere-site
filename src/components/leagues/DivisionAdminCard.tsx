"use client";

import { useState, useTransition } from "react";
import { DangerConfirmButton } from "@/components/ui/DangerConfirmButton";
import { MemberPicker, type PickableMember } from "@/components/ui/MemberPicker";
import { CheckIcon } from "@/components/ui/icons";
import {
  addManualMatch,
  assignParticipant,
  deleteDivision,
  deleteMatch,
  generateNextRound,
  generateRoundRobin,
  removeParticipant,
} from "@/lib/league-actions";
import { useT } from "@/components/i18n/LocaleProvider";
import type { League, LeagueDivision, LeagueMatch } from "@/lib/league-types";

interface DivisionAdminCardProps {
  league: League;
  division: LeagueDivision;
  communityMembers: PickableMember[];
  onOpenMatch: (match: LeagueMatch) => void;
}

export function DivisionAdminCard({ league, division, communityMembers, onOpenMatch }: DivisionAdminCardProps) {
  const { t } = useT();
  const [, startTransition] = useTransition();
  const [matchesExpanded, setMatchesExpanded] = useState(false);

  const divisionParticipantIds = new Set(division.participants.map((p) => p.profileId));
  const availableMembers = communityMembers.filter((m) => !divisionParticipantIds.has(m.id));

  // Ordre podium (classement), pas l'ordre d'ajout — CDC league.
  const orderedParticipants = division.standings
    .map((s) => division.participants.find((p) => p.profileId === s.profileId))
    .filter((p): p is NonNullable<typeof p> => !!p);

  const pendingMatches = division.matches.filter((m) => m.scoreA === null);
  const completedMatches = division.matches.filter((m) => m.scoreA !== null);
  const allowsManualMatch = league.format === "poule" || league.format === "libre";

  const currentRound = division.matches.reduce((max, m) => Math.max(max, m.round ?? 0), 0);
  const roundComplete =
    currentRound === 0 ||
    division.matches.filter((m) => (m.round ?? 0) === currentRound).every((m) => m.scoreA !== null);

  return (
    <div className="section-card">
      <div className="an-section-head">
        <h2 className="page-title" style={{ margin: 0 }}>{division.name}</h2>
        <DangerConfirmButton
          className="join-btn danger small"
          onConfirm={() => startTransition(() => deleteDivision(division.id))}
        >
          {t("common.delete")}
        </DangerConfirmButton>
      </div>

      <div className="modal-section-label">{t("league.admin.roster")}</div>
      {orderedParticipants.map((p) => {
        const standing = division.standings.find((s) => s.profileId === p.profileId);
        return (
          <div className="admin-row" key={p.id}>
            <span className="name">
              {p.displayName}
              {standing && (
                <span className="sub">
                  {p.army ? `${p.army} · ` : ""}
                  {standing.wins}/{standing.played} · {standing.points} {t("league.standings.pointsShort")}
                </span>
              )}
            </span>
            <button
              type="button"
              className="join-btn gray small"
              onClick={() => startTransition(() => removeParticipant(p.id))}
            >
              {t("common.remove")}
            </button>
          </div>
        );
      })}
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
      {(league.format === "suisse" || league.format === "championnat") &&
        division.participants.length % 2 === 1 && (
          <p className="field-note">{t("league.admin.oddParticipantsWarning")}</p>
        )}

      <div className="modal-section-label" style={{ marginTop: 14 }}>
        {t("league.admin.matches")}
      </div>
      {league.format === "poule" && division.matches.length === 0 && (
        <button
          type="button"
          className="af-add-option"
          onClick={() => startTransition(() => { generateRoundRobin(division.id); })}
        >
          + {t("league.admin.generateRoundRobin")}
        </button>
      )}
      {(league.format === "suisse" || league.format === "championnat") && (
        <button
          type="button"
          className="af-add-option"
          disabled={!roundComplete}
          onClick={() => startTransition(() => { generateNextRound(division.id); })}
        >
          + {t("league.admin.generateNextRound", { n: currentRound + 1 })}
        </button>
      )}

      <button
        type="button"
        className="link-btn"
        style={{ display: "block", marginTop: 10 }}
        onClick={() => setMatchesExpanded((v) => !v)}
      >
        {matchesExpanded ? "▾" : "▸"} {t("league.admin.upcomingMatches")} ({pendingMatches.length})
      </button>

      {matchesExpanded && (
        <>
          {allowsManualMatch && <CreateMatchInline divisionId={division.id} members={communityMembers} />}
          {pendingMatches.length === 0 ? (
            <p className="empty-hint">{t("league.admin.noMatchesLeft")}</p>
          ) : (
            pendingMatches.map((m) => (
              <div className="admin-row" key={m.id}>
                <span className="name">
                  {m.playerADisplayName} vs {m.playerBDisplayName}
                  {m.round !== null && <span className="sub">{t("league.admin.roundLabel", { n: m.round })}</span>}
                </span>
                <span className="admin-row-actions">
                  <button type="button" className="join-btn small" onClick={() => onOpenMatch(m)}>
                    {t("league.reportResult")}
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
            ))
          )}
        </>
      )}

      {completedMatches.map((m) => (
        <div className="admin-row" key={m.id}>
          <span className="name">
            {m.playerADisplayName} vs {m.playerBDisplayName}
            {m.round !== null && <span className="sub">{t("league.admin.roundLabel", { n: m.round })}</span>}
            <span className="sub">
              {m.scoreA} – {m.scoreB}
            </span>
          </span>
          <span className="admin-row-actions">
            <button type="button" className="join-btn small" onClick={() => onOpenMatch(m)}>
              {t("common.edit")}
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
}

function CreateMatchInline({ divisionId, members }: { divisionId: string; members: PickableMember[] }) {
  const { t } = useT();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [playerA, setPlayerA] = useState("");
  const [playerB, setPlayerB] = useState("");

  if (!open) {
    return (
      <button type="button" className="af-add-option" onClick={() => setOpen(true)}>
        + {t("league.admin.createMatch")}
      </button>
    );
  }

  const invalid = !playerA || !playerB || playerA === playerB;

  function submit() {
    if (invalid) return;
    startTransition(() => {
      addManualMatch(divisionId, playerA, playerB);
    });
    setPlayerA("");
    setPlayerB("");
    setOpen(false);
  }

  return (
    <div
      className="admin-add-key-row"
      style={invalid ? { border: "1px solid var(--danger)", borderRadius: "var(--radius-sm)", padding: 6 } : undefined}
    >
      <select className="form-input" value={playerA} onChange={(e) => setPlayerA(e.target.value)}>
        <option value="">{t("league.admin.selectPlayer")}</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.displayName}
          </option>
        ))}
      </select>
      <span className="field-note" style={{ flex: "none" }}>
        {t("league.admin.vs")}
      </span>
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
        className="icon-btn"
        disabled={invalid}
        onClick={submit}
        aria-label={t("league.admin.createMatch")}
        title={t("league.admin.createMatch")}
      >
        <CheckIcon />
      </button>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setOpen(false)}
        aria-label={t("common.cancel")}
        title={t("common.cancel")}
      >
        ×
      </button>
    </div>
  );
}
