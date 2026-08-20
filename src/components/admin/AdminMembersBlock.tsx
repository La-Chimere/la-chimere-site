"use client";

import { useMemo, useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { deleteMember, setSignupValidationRequired, validateMember } from "@/lib/admin-actions";
import { relativeActivityDays } from "@/lib/dates";
import { formatActivity } from "@/lib/i18n/format";
import { useT } from "@/components/i18n/LocaleProvider";
import { CheckIcon, SearchIcon } from "@/components/ui/icons";
import type { AdminMember } from "@/lib/admin-types";

interface AdminMembersBlockProps {
  members: AdminMember[];
  activeThisMonth: number;
  totalMembers: number;
  requireSignupValidation: boolean;
}

export function AdminMembersBlock({
  members,
  activeThisMonth,
  totalMembers,
  requireSignupValidation,
}: AdminMembersBlockProps) {
  const { t } = useT();
  const [, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<AdminMember | null>(null);
  const [query, setQuery] = useState("");

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const da = relativeActivityDays(a.lastActivity);
      const db = relativeActivityDays(b.lastActivity);
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });
  }, [members]);

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedMembers;
    return sortedMembers.filter((m) => m.displayName.toLowerCase().includes(q));
  }, [sortedMembers, query]);

  return (
    <>
      <h1 className="page-title">{t("admin.members.title")}</h1>
      <div className="section-card">
        <div className="admin-stats">
          <div className="section-card admin-stat">
            <span className="n">{activeThisMonth}</span>
            <span className="l">{t("admin.members.activeThisMonth")}</span>
          </div>
          <div className="section-card admin-stat">
            <span className="n">{totalMembers}</span>
            <span className="l">{t("admin.members.total")}</span>
          </div>
        </div>

        <div className="admin-row">
          <span className="name">{t("admin.members.requireValidation")}</span>
          <ToggleSwitch
            on={requireSignupValidation}
            onChange={(value) => startTransition(() => setSignupValidationRequired(value))}
            label={t("admin.members.requireValidation")}
          />
        </div>

        <div className="ce-search-wrap" style={{ marginBottom: 10 }}>
          <span className="ce-search-icon">
            <SearchIcon />
          </span>
          <input
            className="form-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("admin.members.searchPlaceholder")}
          />
        </div>

        <div className="admin-scroll-list-tall">
          {filteredMembers.length === 0 ? (
            <p className="admin-empty-hint">{t("admin.members.noMatch")}</p>
          ) : (
            filteredMembers.map((m) => (
              <div className="admin-row" key={m.profileId}>
                <span className="name">
                  {m.displayName}
                  {m.status === "pending" && <span className="sub">{t("admin.members.pending")}</span>}
                  {m.status === "active" && (
                    <span className="sub">{formatActivity(t, relativeActivityDays(m.lastActivity))}</span>
                  )}
                </span>
                <span className="admin-row-actions">
                  {m.status === "pending" && (
                    <button
                      type="button"
                      className="icon-btn approve"
                      onClick={() => startTransition(() => validateMember(m.profileId))}
                      aria-label={t("admin.members.validate")}
                      title={t("admin.members.validate")}
                    >
                      <CheckIcon />
                    </button>
                  )}
                  <button type="button" className="join-btn danger small" onClick={() => setToDelete(m)}>
                    {t("common.delete")}
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)}>
        <h3>{t("admin.members.deleteConfirmTitle")}</h3>
        <p className="key-status">{t("admin.members.deleteConfirmBody")}</p>
        <div className="modal-btn-row">
          <button type="button" className="modal-btn gray" onClick={() => setToDelete(null)}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="modal-btn danger"
            onClick={() => {
              if (!toDelete) return;
              startTransition(() => deleteMember(toDelete.profileId));
              setToDelete(null);
            }}
          >
            {t("common.confirm")}
          </button>
        </div>
      </Modal>
    </>
  );
}
