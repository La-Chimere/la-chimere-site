"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EventItem } from "@/lib/events-types";
import { Modal } from "@/components/ui/Modal";
import {
  deleteEvent,
  joinEvent,
  leaveEvent,
  setEventResult,
  transformToEvent,
} from "@/lib/events-actions";
import { dayLabel } from "@/lib/dates";
import { useT } from "@/components/i18n/LocaleProvider";

interface EventModalProps {
  event: EventItem | null;
  currentUserId: string;
  isAdmin: boolean;
  onClose: () => void;
}

const RESULT_CLASS = { victoire: "v", egalite: "e", defaite: "d" } as const;
const RESULT_KEYS = { victoire: "event.result.win", egalite: "event.result.tie", defaite: "event.result.loss" } as const;

export function EventModal({ event, currentUserId, isAdmin, onClose }: EventModalProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { t, locale } = useT();

  if (!event) return null;

  const isAvailability = event.type === "dispo";
  const isParticipant = event.participants.some((p) => p.profileId === currentUserId);
  const soleParticipant = isParticipant && event.participants.length === 1;
  const canManage = event.createdBy === currentUserId || isAdmin;
  const competitive =
    event.communities.length === 0 || event.communities.some((c) => c.competitive);
  const creator = event.participants.find((p) => p.profileId === event.createdBy);

  function toggleJoin() {
    startTransition(() => {
      if (isParticipant) {
        if (!soleParticipant) leaveEvent(event!.id);
      } else {
        joinEvent(event!.id);
      }
    });
  }

  function onResultClick(profileId: string, current: EventItem["participants"][number]["result"], value: "victoire" | "egalite" | "defaite") {
    const canSetThis = profileId === currentUserId || isAdmin;
    if (!canSetThis) return;
    startTransition(() => {
      setEventResult(event!.id, profileId, current === value ? null : value);
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
        <span>{dayLabel(new Date(event.eventDate), locale)}</span>
        <span>
          {event.startTime.slice(0, 5)}–{event.endTime.slice(0, 5)}
        </span>
        {event.communities.map((c) => (
          <span className="tag genre" key={c.id}>
            {c.label}
          </span>
        ))}
      </div>

      {event.description && <p className="field-note">{event.description}</p>}

      {isAvailability ? (
        <>
          <div className="modal-section-label">{t("event.indicatedBy")}</div>
          <Link href={`/members/${event.createdBy}`} className="mp-name" data-member onClick={onClose}>
            {creator?.displayName ?? t("event.member")}
          </Link>
        </>
      ) : (
        <>
          <div className="modal-section-label">{t("event.participants")}</div>
          <ul className="modal-participants">
            {event.participants.map((p) => (
              <li key={p.profileId}>
                <Link href={`/members/${p.profileId}`} className="mp-name" data-member onClick={onClose}>
                  {p.displayName}
                  {p.hasKey ? " 🔑" : ""}
                </Link>
                {competitive && (
                  <span className="ved-group">
                    {(Object.keys(RESULT_CLASS) as Array<keyof typeof RESULT_CLASS>).map((key) => (
                      <button
                        key={key}
                        type="button"
                        className={`ved-btn ${RESULT_CLASS[key]} ${p.result === key ? "active" : ""}`}
                        onClick={() => onResultClick(p.profileId, p.result, key)}
                        disabled={pending || (p.profileId !== currentUserId && !isAdmin)}
                      >
                        {t(RESULT_KEYS[key])}
                      </button>
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="modal-btn-row">
        {isAvailability ? (
          <button type="button" className="modal-btn gray" onClick={onContact}>
            {t("event.contact")}
          </button>
        ) : (
          <button
            type="button"
            className={`modal-btn ${isParticipant ? "gray" : "primary"}`}
            onClick={toggleJoin}
            disabled={pending || soleParticipant}
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
