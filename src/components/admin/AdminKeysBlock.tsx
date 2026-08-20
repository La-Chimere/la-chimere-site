"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { MemberPicker, type PickableMember } from "@/components/ui/MemberPicker";
import {
  setExitKeyHolder,
  setKeyHolder,
  updateBuildingCode,
  updateKeyTotal,
} from "@/lib/admin-actions";
import { useT } from "@/components/i18n/LocaleProvider";
import { PencilIcon } from "@/components/ui/icons";
import type { AdminMember, ClubSettings } from "@/lib/admin-types";

interface AdminKeysBlockProps {
  members: AdminMember[];
  settings: ClubSettings;
}

export function AdminKeysBlock({ members, settings }: AdminKeysBlockProps) {
  const { t } = useT();
  const [, startTransition] = useTransition();
  const [buildingCode, setBuildingCode] = useState(settings.buildingCode ?? "");
  const [newHolder, setNewHolder] = useState<PickableMember[]>([]);
  const [editingTotal, setEditingTotal] = useState<"total_keys" | "total_exit_keys" | null>(null);
  const [totalInput, setTotalInput] = useState("");
  const [totalError, setTotalError] = useState<string | null>(null);
  const [addKeyError, setAddKeyError] = useState<string | null>(null);

  const keyHolders = members.filter((m) => m.hasKey);
  const exitKeyHolders = members.filter((m) => m.hasExitKey);
  const nonHolders: PickableMember[] = members
    .filter((m) => !m.hasKey)
    .map((m) => ({ id: m.profileId, displayName: m.displayName }));

  function saveTotal() {
    const value = Number(totalInput);
    if (!editingTotal || Number.isNaN(value)) return;
    startTransition(async () => {
      const result = await updateKeyTotal(editingTotal, value);
      if (result.error) {
        setTotalError(result.error);
        return;
      }
      setEditingTotal(null);
    });
  }

  function addHolder() {
    const member = newHolder[0];
    if (!member) return;
    startTransition(async () => {
      const result = await setKeyHolder(member.id, true);
      if (result.error) {
        setAddKeyError(result.error);
        return;
      }
      setNewHolder([]);
      setAddKeyError(null);
    });
  }

  const editingHolderCount = editingTotal === "total_keys" ? keyHolders.length : exitKeyHolders.length;

  return (
    <>
      <h1 className="page-title">{t("admin.keys.title")}</h1>
      <div className="section-card">
        <div className="form-field">
          <label className="form-label">{t("admin.keys.buildingCode")}</label>
          <input
            className="form-input"
            maxLength={12}
            value={buildingCode}
            onChange={(e) => setBuildingCode(e.target.value)}
            onBlur={() => startTransition(() => updateBuildingCode(buildingCode))}
          />
        </div>

        <div className="admin-keys-row">
          <span className="admin-keys-count">
            {keyHolders.length} <span className="admin-keys-suffix">/ {settings.totalKeys} {t("admin.keys.suffix")}</span>
          </span>
          <button
            type="button"
            className="admin-eye-btn"
            title={t("admin.keys.editTotal")}
            onClick={() => {
              setTotalInput(String(settings.totalKeys));
              setEditingTotal("total_keys");
              setTotalError(null);
            }}
          >
            <PencilIcon />
          </button>
        </div>

        <div style={{ marginTop: 10 }}>
          <MemberPicker members={nonHolders} selected={newHolder} onChange={setNewHolder} hideSelectedChips />
        </div>
        <div className="admin-add-key-row">
          <div className="ce-participants" style={{ flex: 1 }}>
            {newHolder.map((m) => (
              <span className="ce-chip" key={m.id}>
                {m.displayName}
                <button type="button" onClick={() => setNewHolder([])} aria-label={t("common.remove")}>
                  ×
                </button>
              </span>
            ))}
          </div>
          <button
            type="button"
            className="join-btn small"
            disabled={newHolder.length === 0 || keyHolders.length >= settings.totalKeys}
            onClick={addHolder}
          >
            {t("admin.keys.giveKey")}
          </button>
        </div>
        {addKeyError && <p className="field-error">{addKeyError}</p>}
        {keyHolders.length >= settings.totalKeys && (
          <p className="field-note">{t("admin.keys.maxReached")}</p>
        )}

        <div className="modal-section-label">{t("admin.keys.holdersTitle")}</div>
        <div className="admin-scroll-list">
          {keyHolders.length === 0 ? (
            <p className="admin-empty-hint">{t("admin.keys.noKeyHolders")}</p>
          ) : (
            keyHolders.map((m) => (
              <div className="admin-row" key={m.profileId}>
                <span className="name">{m.displayName}</span>
                <button
                  type="button"
                  className="join-btn gray small"
                  onClick={() =>
                    startTransition(() => {
                      setKeyHolder(m.profileId, false);
                    })
                  }
                >
                  {t("common.remove")}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="admin-keys-row" style={{ marginTop: 18 }}>
          <span className="admin-keys-count">
            {exitKeyHolders.length} <span className="admin-keys-suffix">/ {settings.totalExitKeys} {t("admin.keys.exitKeysSuffix")}</span>
          </span>
        </div>
        <div className="modal-section-label">{t("admin.keys.exitHoldersTitle")}</div>
        <div className="admin-scroll-list">
          {exitKeyHolders.length === 0 ? (
            <p className="admin-empty-hint">{t("admin.keys.noExitKeyHolders")}</p>
          ) : (
            exitKeyHolders.map((m) => (
              <div className="admin-row" key={m.profileId}>
                <span className="name">{m.displayName}</span>
                <button
                  type="button"
                  className="join-btn gray small"
                  onClick={() => startTransition(() => setExitKeyHolder(m.profileId, false))}
                >
                  {t("common.remove")}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal open={!!editingTotal} onClose={() => setEditingTotal(null)}>
        <h3>
          {editingTotal === "total_keys" ? t("admin.keys.editTotalTitle") : t("admin.keys.editExitTotalTitle")}
        </h3>
        <div className="form-field">
          <label className="form-label">{t("admin.keys.totalLabel", { n: editingHolderCount })}</label>
          <input
            type="number"
            inputMode="numeric"
            min={editingHolderCount}
            className="form-input"
            value={totalInput}
            onChange={(e) => setTotalInput(e.target.value)}
          />
        </div>
        {totalError && <p className="field-error">{totalError}</p>}
        <div className="modal-btn-row">
          <button type="button" className="modal-btn gray" onClick={() => setEditingTotal(null)}>
            {t("common.cancel")}
          </button>
          <button type="button" className="modal-btn primary" onClick={saveTotal}>
            {t("common.save")}
          </button>
        </div>
      </Modal>
    </>
  );
}
