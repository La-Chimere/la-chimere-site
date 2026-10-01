"use client";

import { useState, useTransition } from "react";
import { MemberPicker, type PickableMember } from "@/components/ui/MemberPicker";
import { setLeagueCreatorRole } from "@/lib/admin-actions";
import { useT } from "@/components/i18n/LocaleProvider";

interface AdminLeaguesBlockProps {
  organizers: PickableMember[];
  nonOrganizers: PickableMember[];
}

// Même fonctionnement et interface que la désignation des admins dans
// Paramètres (SettingsClient) : recherche + chip + bouton pour accorder,
// liste des organisateurs actuels avec bouton pour retirer.
export function AdminLeaguesBlock({ organizers, nonOrganizers }: AdminLeaguesBlockProps) {
  const { t } = useT();
  const [, startTransition] = useTransition();
  const [newOrganizer, setNewOrganizer] = useState<PickableMember[]>([]);

  return (
    <>
      <h1 className="page-title">{t("admin.leagues.title")}</h1>
      <div className="section-card">
        <MemberPicker
          members={nonOrganizers}
          selected={newOrganizer}
          onChange={setNewOrganizer}
          hideSelectedChips
          placeholder={t("admin.members.searchPlaceholder")}
        />
        <div className="admin-add-key-row">
          <div className="ce-participants" style={{ flex: 1 }}>
            {newOrganizer.map((a) => (
              <span className="ce-chip" key={a.id}>
                {a.displayName}
                <button type="button" onClick={() => setNewOrganizer([])} aria-label={t("common.remove")}>
                  ×
                </button>
              </span>
            ))}
          </div>
          <button
            type="button"
            className="join-btn small"
            disabled={newOrganizer.length === 0}
            onClick={() => {
              startTransition(() => setLeagueCreatorRole(newOrganizer[0].id, true));
              setNewOrganizer([]);
            }}
          >
            {t("admin.leagues.grant")}
          </button>
        </div>
        <div className="modal-section-label" style={{ marginTop: 14 }}>
          {t("admin.leagues.current")}
        </div>
        <div className="admin-scroll-list">
          {organizers.length === 0 ? (
            <p className="admin-empty-hint">{t("admin.leagues.none")}</p>
          ) : (
            organizers.map((a) => (
              <div className="admin-row" key={a.id}>
                <span className="name">{a.displayName}</span>
                <button
                  type="button"
                  className="join-btn gray small"
                  onClick={() => startTransition(() => setLeagueCreatorRole(a.id, false))}
                >
                  {t("common.remove")}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
