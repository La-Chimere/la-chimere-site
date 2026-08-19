"use client";

import { useTransition } from "react";
import Link from "next/link";
import type { EventItem } from "@/lib/events-types";
import { Modal } from "@/components/ui/Modal";
import { deleteEvent, joinEvent, leaveEvent, setEventResult } from "@/lib/events-actions";
import { dayLabel } from "@/lib/dates";

interface EventModalProps {
  event: EventItem | null;
  currentUserId: string;
  isAdmin: boolean;
  onClose: () => void;
}

const RESULT_LABELS = { victoire: "v", egalite: "e", defaite: "d" } as const;

export function EventModal({ event, currentUserId, isAdmin, onClose }: EventModalProps) {
  const [pending, startTransition] = useTransition();

  if (!event) return null;

  const isParticipant = event.participants.some((p) => p.profileId === currentUserId);
  const soleParticipant = isParticipant && event.participants.length === 1;
  const canManage = event.createdBy === currentUserId || isAdmin;
  const competitive =
    event.communities.length === 0 || event.communities.some((c) => c.competitive);

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

  const title = event.title || event.communities.map((c) => c.label).join(", ") || "Partie";

  return (
    <Modal open={!!event} onClose={onClose}>
      <h3>{title}</h3>
      <div className="modal-meta">
        <span>{dayLabel(new Date(event.eventDate))}</span>
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

      <div className="modal-section-label">Participants</div>
      <ul className="modal-participants">
        {event.participants.map((p) => (
          <li key={p.profileId}>
            <Link href={`/members/${p.profileId}`} className="mp-name" data-member>
              {p.displayName}
              {p.hasKey ? " 🔑" : ""}
            </Link>
            {competitive && (
              <span className="ved-group">
                {(Object.keys(RESULT_LABELS) as Array<keyof typeof RESULT_LABELS>).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`ved-btn ${RESULT_LABELS[key]} ${p.result === key ? "active" : ""}`}
                    onClick={() => onResultClick(p.profileId, p.result, key)}
                    disabled={pending || (p.profileId !== currentUserId && !isAdmin)}
                  >
                    {RESULT_LABELS[key].toUpperCase()}
                  </button>
                ))}
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="modal-btn-row">
        <button
          type="button"
          className={`modal-btn ${isParticipant ? "gray" : "primary"}`}
          onClick={toggleJoin}
          disabled={pending || soleParticipant}
        >
          {isParticipant ? "Se désinscrire" : "Rejoindre"}
        </button>
        {canManage && (
          <button type="button" className="modal-btn danger" onClick={onDelete} disabled={pending}>
            Supprimer
          </button>
        )}
      </div>
    </Modal>
  );
}
