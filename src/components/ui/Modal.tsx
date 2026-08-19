"use client";

import { type ReactNode } from "react";
import { useT } from "@/components/i18n/LocaleProvider";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

// Bottom-sheet sur mobile, dialog centré >=640px (CDC 12.1/12.4). Fermeture
// via le clic sur le fond, ou le bouton "X" fourni par l'appelant.
export function Modal({ open, onClose, children }: ModalProps) {
  const { t } = useT();
  if (!open) return null;

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        <button
          type="button"
          className="modal-close"
          aria-label={t("common.close")}
          onClick={onClose}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
