"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { deleteMyAvailabilities } from "@/lib/events-actions";

interface AvailabilityMenuProps {
  showAvailabilities: boolean;
  onToggleShow: () => void;
  onIndicate: () => void;
}

// Bouton "Dispos" + menu déroulant (CDC 12.12) : Afficher/Masquer,
// Indiquer ma dispo, Supprimer mes dispos.
export function AvailabilityMenu({ showAvailabilities, onToggleShow, onIndicate }: AvailabilityMenuProps) {
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
        <span className="avail-eye">{showAvailabilities ? "👁" : "🙈"}</span>
        Dispos
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
          {showAvailabilities ? "Masquer" : "Afficher"}
        </button>
        <button
          type="button"
          className="acc-item"
          onClick={() => {
            onIndicate();
            setOpen(false);
          }}
        >
          Indiquer ma dispo
        </button>
        <button
          type="button"
          className="acc-item danger"
          onClick={() => {
            setConfirmOpen(true);
            setOpen(false);
          }}
        >
          Supprimer mes dispos
        </button>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <h3>Supprimer mes disponibilités</h3>
        <p className="field-note">
          Toutes les disponibilités que vous avez indiquées vont être supprimées du calendrier.
        </p>
        <div className="modal-btn-row">
          <button type="button" className="modal-btn gray" onClick={() => setConfirmOpen(false)}>
            Annuler
          </button>
          <button
            type="button"
            className="modal-btn danger"
            onClick={() => {
              deleteMyAvailabilities();
              setConfirmOpen(false);
            }}
          >
            Confirmer
          </button>
        </div>
      </Modal>
    </div>
  );
}
