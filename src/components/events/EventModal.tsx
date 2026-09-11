"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EventItem } from "@/lib/events-types";
import { Modal } from "@/components/ui/Modal";
import { AvatarCircle } from "@/components/ui/AvatarCircle";
import { MemberPicker, type PickableMember } from "@/components/ui/MemberPicker";
import {
  addEventParticipant,
  deleteEvent,
  joinEvent,
  leaveEvent,
  setEventResult,
  transformToEvent,
} from "@/lib/events-actions";
import { dayHeaderLabel, formatHour } from "@/lib/dates";
import { useT } from "@/components/i18n/LocaleProvider";

interface EventModalProps {
  event: EventItem | null;
  keyStatus: { ok: boolean; from?: string } | null;
  currentUserId: string;
  isAdmin: boolean;
  onClose: () => void;
  /** Membres du club, pour proposer d'en ajouter d'autres comme participants
   * (créateur/admin uniquement). Omis = pas de picker d'ajout (ex. modale
   * réutilisée sur la page Communautés, où la liste complète des membres
   * n'est pas chargée). */
  members?: PickableMember[];
}

const RESULT_CLASS = { victoire: "v", egalite: "e", defaite: "d" } as const;
const RESULT_KEYS = { victoire: "event.result.win", egalite: "event.result.tie", defaite: "event.result.loss" } as const;

export function EventModal({ event, keyStatus, currentUserId, isAdmin, onClose, members }: EventModalProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { t, locale } = useT();
  const [optimisticParticipants, applyOptimistic] = useOptimistic(
    event?.participants ?? [],
    (
      current: EventItem["participants"],
      action:
        | { type: "result"; profileId: string; result: EventItem["participants"][number]["result"] }
        | { type: "leave"; profileId: string },
    ) => {
      if (action.type === "leave") return current.filter((p) => p.profileId !== action.profileId);
      return current.map((p) =>
        p.profileId === action.profileId ? { ...p, result: action.result } : p,
      );
    },
  );

  if (!event) return null;

  const isAvailability = event.type === "dispo";
  const isParticipant = optimisticParticipants.some((p) => p.profileId === currentUserId);
  const soleParticipant = isParticipant && optimisticParticipants.length === 1;
  const canManage = event.createdBy === currentUserId || isAdmin;
  const competitive = event.communities.some((c) => c.competitive);
  const creator = optimisticParticipants.find((p) => p.profileId === event.createdBy);

  function toggleJoin() {
    if (isParticipant) {
      if (soleParticipant) return;
      startTransition(() => {
        applyOptimistic({ type: "leave", profileId: currentUserId });
        leaveEvent(event!.id);
      });
    } else {
      joinEvent(event!.id);
    }
  }

  function onResultClick(profileId: string, current: EventItem["participants"][number]["result"], value: "victoire" | "egalite" | "defaite") {
    // N'importe quel participant peut renseigner le résultat de n'importe
    // quel autre participant du même évènement (pas seulement le sien) —
    // en pratique une seule personne saisit souvent tous les résultats.
    const canSetThis = isParticipant || isAdmin;
    if (!canSetThis) return;
    const nextResult = current === value ? null : value;
    startTransition(() => {
      applyOptimistic({ type: "result", profileId, result: nextResult });
      setEventResult(event!.id, profileId, nextResult);
    });
  }

  function onDelete() {
    startTransition(() => {
      deleteEvent(event!.id);
      onClose();
    });
  }

  function onTransform() {
    startTransition(() => {
      transformToEvent(event!.id);
      onClose();
    });
  }

  function onContact() {
    onClose();
    router.push(`/members/${event!.createdBy}`);
  }

  const title = event.title || event.communities.map((c) => c.label).join(", ") || t("event.defaultTitle");

  return (
    <Modal open={!!event} onClose={onClose}>
      <h3>{title}</h3>
      <div className="modal-meta">
        <span>
          {dayHeaderLabel(new Date(event.eventDate), locale)} · {formatHour(event.startTime)}–
          {formatHour(event.endTime)}
        </span>
        {keyStatus?.ok ? (
          <span className="tag ok">🔑 {t("programme.modalKeyOpenFrom", { hour: parseInt(keyStatus.from!, 10) })}</span>
        ) : (
          <span className="tag warn">⚠ {t("programme.modalNoKeyConfirmed")}</span>
        )}
        {isAvailability && event.repeatsWeekly && (
          <span className="tag genre">🔁 {t("event.form.repeatsWeekly")}</span>
        )}
      </div>

      {event.description && <p className="field-note">{event.description}</p>}

      {!isAvailability && <div className="modal-section-label">{t("event.participants")}</div>}
      {isAvailability ? (
        creator && (
          <ul className="modal-participants">
            <li>
              <AvatarCircle name={creator.displayName} photoUrl={creator.avatarUrl} size="sm" />
              <Link href={`/members/${creator.profileId}`} className="mp-name" data-member onClick={onClose}>
                {creator.displayName}
                {creator.hasKey ? <span className="tag ok" style={{ marginLeft: 4 }}>🔑</span> : ""}
              </Link>
            </li>
          </ul>
        )
      ) : (
        <ul className="modal-participants">
          {optimisticParticipants.map((p) => (
            <li key={p.profileId}>
              <AvatarCircle name={p.displayName} photoUrl={p.avatarUrl} size="sm" />
              <Link href={`/members/${p.profileId}`} className="mp-name" data-member onClick={onClose}>
                {p.displayName}
                {p.hasKey ? <span className="tag ok" style={{ marginLeft: 4 }}>🔑</span> : ""}
              </Link>
              {competitive && (
                <span className="ved-group">
                  {(Object.keys(RESULT_CLASS) as Array<keyof typeof RESULT_CLASS>).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={`ved-btn ${RESULT_CLASS[key]} ${p.result === key ? "active" : ""}`}
                      onClick={() => onResultClick(p.profileId, p.result, key)}
                      disabled={!isParticipant && !isAdmin}
                    >
                      {t(RESULT_KEYS[key])}
                    </button>
                  ))}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && !isAvailability && members && (
        <MemberPicker
          members={members}
          selected={optimisticParticipants.map((p) => ({ id: p.profileId, displayName: p.displayName }))}
          onChange={(next) => {
            const added = next.find((m) => !optimisticParticipants.some((p) => p.profileId === m.id));
            if (added) {
              startTransition(() => {
                addEventParticipant(event!.id, added.id);
              });
            }
          }}
          placeholder={t("event.addParticipant")}
          hideSelectedChips
        />
      )}

      <div className="modal-btn-row">
        {isAvailability ? (
          event.createdBy !== currentUserId && (
            <button type="button" className="modal-btn primary" onClick={onContact}>
              {t("event.contact")}
            </button>
          )
        ) : (
          <button
            type="button"
            className="modal-btn primary"
            onClick={toggleJoin}
            disabled={soleParticipant}
          >
            {isParticipant ? t("event.leave") : t("event.join")}
          </button>
        )}
        {canManage && (
          <button type="button" className="modal-btn danger" onClick={onDelete} disabled={pending}>
            {t("common.delete")}
          </button>
        )}
      </div>
      {isAvailability && canManage && (
        <button type="button" className="modal-btn outline modal-btn-full" onClick={onTransform} disabled={pending}>
          {t("event.transformToEvent")}
        </button>
      )}
    </Modal>
  );
}
