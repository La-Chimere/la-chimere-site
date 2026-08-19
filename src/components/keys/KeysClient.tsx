"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { MemberPicker, type PickableMember } from "@/components/ui/MemberPicker";
import { borrowExitKey, reportLostKey, transferKey } from "@/lib/keys-actions";

interface KeysClientProps {
  hasKey: boolean;
  hasExitKey: boolean;
  buildingCode: string | null;
  otherMembers: PickableMember[];
}

export function KeysClient({ hasKey, hasExitKey, buildingCode, otherMembers }: KeysClientProps) {
  const [pending, startTransition] = useTransition();
  const [transferOpen, setTransferOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [recipient, setRecipient] = useState<PickableMember[]>([]);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="page">
      <div className="subpage-back-row">
        <a href="/programme" className="subpage-back">
          ‹ Retour
        </a>
      </div>
      <h1 className="page-title">Les clés</h1>

      <div className="section-card">
        <p className="key-code">{buildingCode ?? "—"}</p>
        <p className="key-status">Code d&apos;entrée de l&apos;immeuble.</p>

        {hasKey ? (
          <>
            <p className="key-status">Tu es porteur d&apos;une clé du local.</p>
            <div className="modal-btn-row">
              <button type="button" className="modal-btn outline" onClick={() => setTransferOpen(true)}>
                Donner mes clés
              </button>
              <button type="button" className="modal-btn danger" onClick={() => setLostOpen(true)}>
                J&apos;ai perdu mes clés
              </button>
            </div>
          </>
        ) : hasExitKey ? (
          <p className="key-status">
            Tu as actuellement emprunté les clés pour sortir — pense à les rapporter avant ta
            prochaine sortie du local.
          </p>
        ) : (
          <>
            <p className="key-status">Tu n&apos;es pas porteur de clé.</p>
            <button
              type="button"
              className="modal-btn primary modal-btn-full"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await borrowExitKey();
                  if (result.error) setError(result.error);
                })
              }
            >
              J&apos;ai emprunté les clés pour sortir
            </button>
            {error && <p className="field-error">{error}</p>}
          </>
        )}
      </div>

      <Modal open={transferOpen} onClose={() => setTransferOpen(false)}>
        <h3>Donner mes clés à un autre membre</h3>
        <div className="form-field">
          <MemberPicker members={otherMembers} selected={recipient} onChange={setRecipient} />
        </div>
        <button
          type="button"
          className="modal-btn primary modal-btn-full"
          disabled={recipient.length === 0 || pending}
          onClick={() =>
            startTransition(async () => {
              const result = await transferKey(recipient[0].id);
              if (result.error) {
                setError(result.error);
                return;
              }
              setTransferOpen(false);
              setRecipient([]);
            })
          }
        >
          Confirmer le transfert
        </button>
      </Modal>

      <Modal open={lostOpen} onClose={() => setLostOpen(false)}>
        <h3>J&apos;ai perdu mes clés</h3>
        <p className="field-note">
          Ton statut de porteur de clé sera retiré immédiatement et le comité sera prévenu.
        </p>
        <div className="modal-btn-row">
          <button type="button" className="modal-btn gray" onClick={() => setLostOpen(false)}>
            Annuler
          </button>
          <button
            type="button"
            className="modal-btn danger"
            onClick={() => {
              startTransition(() => reportLostKey());
              setLostOpen(false);
            }}
          >
            Confirmer
          </button>
        </div>
      </Modal>
    </div>
  );
}
