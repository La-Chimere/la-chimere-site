"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { deleteMember, validateMember } from "@/lib/admin-actions";
import { relativeActivityLabel } from "@/lib/dates";
import type { AdminMember } from "@/lib/admin-types";

interface AdminMembersBlockProps {
  members: AdminMember[];
  activeThisMonth: number;
  totalMembers: number;
}

export function AdminMembersBlock({ members, activeThisMonth, totalMembers }: AdminMembersBlockProps) {
  const [, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<AdminMember | null>(null);

  return (
    <div className="section-card">
      <div className="section-subtitle">Membres</div>

      <div className="admin-stats">
        <div className="admin-stat">
          <span className="n">{activeThisMonth}</span>
          <span className="l">actifs ce mois-ci</span>
        </div>
        <div className="admin-stat">
          <span className="n">{totalMembers}</span>
          <span className="l">membres au total</span>
        </div>
      </div>

      <div className="admin-scroll-list-tall">
        {members.map((m) => (
          <div className="admin-row" key={m.profileId}>
            <span className="name">
              {m.displayName}
              {m.status === "pending" && <span className="sub">En attente de validation</span>}
              {m.status === "active" && (
                <span className="sub">{relativeActivityLabel(m.lastActivity)}</span>
              )}
            </span>
            <span className="admin-row-actions">
              {m.status === "pending" && (
                <button
                  type="button"
                  className="join-btn small"
                  onClick={() => startTransition(() => validateMember(m.profileId))}
                >
                  Valider
                </button>
              )}
              <button type="button" className="join-btn danger small" onClick={() => setToDelete(m)}>
                Supprimer
              </button>
            </span>
          </div>
        ))}
      </div>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)}>
        <h3>Supprimer ce membre ?</h3>
        <p className="field-note">
          Attention, toutes les informations de ce membre seront supprimées et il ne pourra plus
          accéder à l&apos;app.
        </p>
        <div className="modal-btn-row">
          <button type="button" className="modal-btn gray" onClick={() => setToDelete(null)}>
            Annuler
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
            Confirmer
          </button>
        </div>
      </Modal>
    </div>
  );
}
