"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import {
  addCommunity,
  setCommunityCompetitive,
  setCommunityHidden,
  updateCommunityLabel,
} from "@/lib/admin-actions";
import { useT } from "@/components/i18n/LocaleProvider";
import { EyeIcon } from "@/components/ui/icons";
import type { AdminCommunity } from "@/lib/admin-types";

interface AdminCommunitiesBlockProps {
  communities: AdminCommunity[];
}

export function AdminCommunitiesBlock({ communities }: AdminCommunitiesBlockProps) {
  const { t } = useT();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<AdminCommunity | "new" | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function openNew() {
    setNameInput("");
    setError(null);
    setEditing("new");
  }

  function openEdit(c: AdminCommunity) {
    setNameInput(c.label);
    setError(null);
    setEditing(c);
  }

  function save() {
    if (!nameInput.trim()) return;
    startTransition(async () => {
      if (editing === "new") {
        const result = await addCommunity(nameInput.trim());
        if (result.error) {
          setError(result.error);
          return;
        }
      } else if (editing) {
        await updateCommunityLabel(editing.id, nameInput.trim());
      }
      setEditing(null);
    });
  }

  return (
    <div className="section-card">
      <div className="section-subtitle">{t("admin.communities.title")}</div>
      <button type="button" className="join-btn small" onClick={openNew} style={{ marginBottom: 10 }}>
        + {t("admin.communities.add")}
      </button>

      <div className="admin-scroll-list">
        {communities.map((c) => (
          <div className={`admin-row ${c.hidden ? "hidden-commu" : ""}`} key={c.id}>
            <span className="name">{c.label}</span>
            <span className="admin-row-actions">
              <button
                type="button"
                className={`admin-eye-btn ${c.competitive ? "active" : ""}`}
                title={t("admin.communities.competitiveToggle")}
                onClick={() =>
                  startTransition(() => setCommunityCompetitive(c.id, !c.competitive))
                }
              >
                🏆
              </button>
              <button
                type="button"
                className={`admin-eye-btn ${!c.hidden ? "active" : ""}`}
                title={c.hidden ? t("admin.communities.hidden") : t("admin.communities.visible")}
                onClick={() => startTransition(() => setCommunityHidden(c.id, !c.hidden))}
              >
                <EyeIcon crossed={c.hidden} />
              </button>
              <button type="button" className="join-btn gray small" onClick={() => openEdit(c)}>
                {t("common.edit")}
              </button>
            </span>
          </div>
        ))}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)}>
        <h3>{editing === "new" ? t("admin.communities.add") : t("admin.communities.editTitle")}</h3>
        <div className="form-field">
          <label className="form-label">{t("admin.communities.name")}</label>
          <input className="form-input" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
        </div>
        {error && <p className="field-error">{error}</p>}
        <div className="modal-btn-row">
          <button type="button" className="modal-btn gray" onClick={() => setEditing(null)}>
            {t("common.cancel")}
          </button>
          <button type="button" className="modal-btn primary" disabled={!nameInput.trim()} onClick={save}>
            {t("common.save")}
          </button>
        </div>
      </Modal>
    </div>
  );
}
