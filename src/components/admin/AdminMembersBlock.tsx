"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { deleteMember, validateMember } from "@/lib/admin-actions";
import { relativeActivityDays } from "@/lib/dates";
import { formatActivity } from "@/lib/i18n/format";
import { useT } from "@/components/i18n/LocaleProvider";
import type { AdminMember } from "@/lib/admin-types";

interface AdminMembersBlockProps {
  members: AdminMember[];
  activeThisMonth: number;
  totalMembers: number;
}

export function AdminMembersBlock({ members, activeThisMonth, totalMembers }: AdminMembersBlockProps) {
  const { t } = useT();
  const [, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<AdminMember | null>(null);

  return (
    <div className="section-card">
      <div className="section-subtitle">{t("admin.members.title")}</div>

      <div className="admin-stats">
        <div className="admin-stat">
          <span className="n">{activeThisMonth}</span>
          <span className="l">{t("admin.members.activeThisMonth")}</span>
        </div>
        <div className="admin-stat">
          <span className="n">{totalMembers}</span>
          <span className="l">{t("admin.members.total")}</span>
        </div>
      </div>

      <div className="admin-scroll-list-tall">
        {members.map((m) => (
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
                  className="join-btn small"
                  onClick={() => startTransition(() => validateMember(m.profileId))}
                >
                  {t("admin.members.validate")}
                </button>
              )}
              <button type="button" className="join-btn danger small" onClick={() => setToDelete(m)}>
                {t("common.delete")}
              </button>
            </span>
          </div>
        ))}
      </div>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)}>
        <h3>{t("admin.members.deleteConfirmTitle")}</h3>
        <p className="field-note">{t("admin.members.deleteConfirmBody")}</p>
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
    </div>
  );
}
