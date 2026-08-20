"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { deleteMyAvailabilities } from "@/lib/events-actions";
import { useT } from "@/components/i18n/LocaleProvider";
import { EyeIcon } from "@/components/ui/icons";

interface AvailabilityMenuProps {
  showAvailabilities: boolean;
  onToggleShow: () => void;
  onIndicate: () => void;
}

// Bouton "Dispos" + menu déroulant (CDC 12.12) : Afficher/Masquer,
// Indiquer ma dispo, Supprimer mes dispos.
export function AvailabilityMenu({ showAvailabilities, onToggleShow, onIndicate }: AvailabilityMenuProps) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div className="avail-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`avail-btn ${showAvailabilities ? "active" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        {t("availability.menuButton")}
        <span className="avail-eye">
          <EyeIcon crossed={!showAvailabilities} />
        </span>
      </button>
      <div className={`dropdown avail-dropdown ${open ? "open" : ""}`}>
        <button
          type="button"
          className="acc-item"
          onClick={() => {
            onToggleShow();
            setOpen(false);
          }}
        >
          {showAvailabilities ? t("availability.hide") : t("availability.show")}
        </button>
        <button
          type="button"
          className="acc-item"
          onClick={() => {
            onIndicate();
            setOpen(false);
          }}
        >
          {t("availability.indicate")}
        </button>
        <button
          type="button"
          className="acc-item danger"
          onClick={() => {
            setConfirmOpen(true);
            setOpen(false);
          }}
        >
          {t("availability.deleteMine")}
        </button>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <h3>{t("availability.deleteConfirmTitle")}</h3>
        <p className="field-note">{t("availability.deleteConfirmBody")}</p>
        <div className="modal-btn-row">
          <button type="button" className="modal-btn outline" onClick={() => setConfirmOpen(false)}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="modal-btn danger"
            onClick={() => {
              deleteMyAvailabilities();
              setConfirmOpen(false);
            }}
          >
            {t("common.confirm")}
          </button>
        </div>
      </Modal>
    </div>
  );
}
