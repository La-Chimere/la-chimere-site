"use client";

import { useState, useTransition } from "react";
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
            {!transferOpen && (
              <>
                <button type="button" className="modal-join" onClick={() => setTransferOpen(true)}>
                  {t("keys.giveMyKeys")}
                </button>
                <button
                  type="button"
                  className="modal-btn danger modal-btn-full"
                  onClick={() => startTransition(() => reportLostKey())}
                >
                  {t("keys.iLostMyKeys")}
                </button>
              </>
            )}
          </>
        ) : hasExitKey ? (
          <>
            <div className="modal-section-label">{t("keys.statusLabel")}</div>
            <p className="key-status">{t("keys.currentlyBorrowed")}</p>
          </>
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
            <p className="field-note">{t("keys.exitKeyNote")}</p>
            {error && <p className="field-error">{error}</p>}
          </>
        )}

        {transferOpen && (
          <div className="form-field" style={{ marginTop: 14 }}>
            <label className="form-label">{t("keys.giveToAnotherMember")}</label>
            <MemberPicker members={otherMembers} selected={recipient} onChange={setRecipient} />
            <div className="modal-btn-row">
              <button
                type="button"
                className="modal-btn gray"
                onClick={() => {
                  setTransferOpen(false);
                  setRecipient([]);
                }}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className="modal-btn primary"
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
