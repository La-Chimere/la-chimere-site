"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { MemberPicker, type PickableMember } from "@/components/ui/MemberPicker";
import { borrowExitKey, reportLostKey, transferKey } from "@/lib/keys-actions";
import { useT } from "@/components/i18n/LocaleProvider";
import { BackArrowIcon } from "@/components/ui/icons";

interface KeysClientProps {
  hasKey: boolean;
  hasExitKey: boolean;
  buildingCode: string | null;
  otherMembers: PickableMember[];
}

export function KeysClient({ hasKey, hasExitKey, buildingCode, otherMembers }: KeysClientProps) {
  const { t } = useT();
  const [pending, startTransition] = useTransition();
  const [transferOpen, setTransferOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [recipient, setRecipient] = useState<PickableMember[]>([]);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="page">
      <div className="subpage-back-row">
        <a href="/programme" className="subpage-back">
          <BackArrowIcon /> {t("common.back")}
        </a>
      </div>
      <h1 className="page-title">{t("header.theKeys")}</h1>

      <div className="section-card">
        <p className="key-code">{buildingCode ?? "—"}</p>
        <p className="key-status">{t("keys.buildingCode")}</p>

        {hasKey ? (
          <>
            <p className="key-status">{t("keys.iHaveKey")}</p>
            <div className="modal-btn-row">
              <button type="button" className="modal-btn outline" onClick={() => setTransferOpen(true)}>
                {t("keys.giveMyKeys")}
              </button>
              <button type="button" className="modal-btn danger" onClick={() => setLostOpen(true)}>
                {t("keys.iLostMyKeys")}
              </button>
            </div>
          </>
        ) : hasExitKey ? (
          <p className="key-status">{t("keys.currentlyBorrowed")}</p>
        ) : (
          <>
            <p className="key-status">{t("keys.iDontHaveKey")}</p>
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
              {t("keys.iBorrowedExitKeys")}
            </button>
            {error && <p className="field-error">{error}</p>}
          </>
        )}
      </div>

      <Modal open={transferOpen} onClose={() => setTransferOpen(false)}>
        <h3>{t("keys.giveToAnotherMember")}</h3>
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
          {t("keys.confirmTransfer")}
        </button>
      </Modal>

      <Modal open={lostOpen} onClose={() => setLostOpen(false)}>
        <h3>{t("keys.iLostMyKeys")}</h3>
        <p className="field-note">{t("keys.lostKeyNote")}</p>
        <div className="modal-btn-row">
          <button type="button" className="modal-btn gray" onClick={() => setLostOpen(false)}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="modal-btn danger"
            onClick={() => {
              startTransition(() => reportLostKey());
              setLostOpen(false);
            }}
          >
            {t("common.confirm")}
          </button>
        </div>
      </Modal>
    </div>
  );
}
