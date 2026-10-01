"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { setMatchResult } from "@/lib/league-actions";
import { useT } from "@/components/i18n/LocaleProvider";
import type { LeagueMatch } from "@/lib/league-types";

interface MatchResultModalProps {
  match: LeagueMatch | null;
  onClose: () => void;
}

// Saisie/correction d'un score de match de ligue (sur 100, chaque côté) —
// utilisé à la fois depuis la vue joueur et la vue organisateur, modifiable
// à tout moment (CDC league : pas de verrou après coup).
export function MatchResultModal({ match, onClose }: MatchResultModalProps) {
  const { t } = useT();
  const [pending, startTransition] = useTransition();
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");

  if (!match) return null;

  function submit() {
    const a = Number(scoreA);
    const b = Number(scoreB);
    if (!match || Number.isNaN(a) || Number.isNaN(b) || a < 0 || a > 100 || b < 0 || b > 100) return;
    startTransition(async () => {
      await setMatchResult(match.id, a, b);
      setScoreA("");
      setScoreB("");
      onClose();
    });
  }

  const valid =
    scoreA.trim() !== "" &&
    scoreB.trim() !== "" &&
    Number(scoreA) >= 0 &&
    Number(scoreA) <= 100 &&
    Number(scoreB) >= 0 &&
    Number(scoreB) <= 100;

  return (
    <Modal open={!!match} onClose={onClose}>
      <h3>{t("league.matchResult.title")}</h3>
      <div className="form-field">
        <label className="form-label">{match.playerADisplayName}</label>
        <input
          type="number"
          className="form-input"
          min={0}
          max={100}
          value={scoreA}
          onChange={(e) => setScoreA(e.target.value)}
          placeholder={t("league.matchResult.scorePlaceholder")}
        />
      </div>
      <div className="form-field">
        <label className="form-label">{match.playerBDisplayName}</label>
        <input
          type="number"
          className="form-input"
          min={0}
          max={100}
          value={scoreB}
          onChange={(e) => setScoreB(e.target.value)}
          placeholder={t("league.matchResult.scorePlaceholder")}
        />
      </div>
      <div className="modal-btn-row">
        <button type="button" className="modal-btn gray" onClick={onClose}>
          {t("common.cancel")}
        </button>
        <button type="button" className="modal-btn primary" onClick={submit} disabled={!valid || pending}>
          {t("common.save")}
        </button>
      </div>
    </Modal>
  );
}
