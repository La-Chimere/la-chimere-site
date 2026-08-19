"use client";

import { useTransition } from "react";
import type { EventItem } from "@/lib/events-types";
import { joinEvent, leaveEvent } from "@/lib/events-actions";

interface EventCardProps {
  event: EventItem;
  currentUserId: string;
  onOpen: () => void;
}

export function EventCard({ event, currentUserId, onOpen }: EventCardProps) {
  const [pending, startTransition] = useTransition();
  const isParticipant = event.participants.some((p) => p.profileId === currentUserId);
  const soleParticipant = isParticipant && event.participants.length === 1;

  function toggleJoin(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(() => {
      if (isParticipant) {
        if (!soleParticipant) leaveEvent(event.id);
      } else {
        joinEvent(event.id);
      }
    });
  }

  const time = event.startTime.slice(0, 5);
  const title = event.title || event.communities.map((c) => c.label).join(", ") || "Partie";
  const who =
    event.participants.length > 0
      ? event.participants.map((p) => p.displayName).join(", ")
      : "Aucun participant";

  return (
    <div className="event-card" onClick={onOpen}>
      <div className="top">
        <div className="top-left">
          <span className="time">{time}</span>
          {event.communities.map((c) => (
            <span className="tag genre" key={c.id}>
              {c.label}
            </span>
          ))}
        </div>
      </div>
      <div className="title">{title}</div>
      <div className="bottom">
        <span className="who">{who}</span>
        <button
          type="button"
          className={`join-btn ${isParticipant ? "gray" : ""}`}
          onClick={toggleJoin}
          disabled={pending || soleParticipant}
        >
          {isParticipant ? "Rejoint ✓" : "Rejoindre"}
        </button>
      </div>
    </div>
  );
}
