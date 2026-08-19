"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EventItem } from "@/lib/events-types";
import { joinEvent, leaveEvent } from "@/lib/events-actions";
import { useT } from "@/components/i18n/LocaleProvider";

interface EventCardProps {
  event: EventItem;
  currentUserId: string;
  onOpen: () => void;
}

export function EventCard({ event, currentUserId, onOpen }: EventCardProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { t } = useT();
  const isAvailability = event.type === "dispo";
  const isParticipant = event.participants.some((p) => p.profileId === currentUserId);
  const soleParticipant = isParticipant && event.participants.length === 1;
  const hasKeyHolder = event.participants.some((p) => p.hasKey);

  function toggleJoin(e: React.MouseEvent) {
    e.stopPropagation();
    if (isAvailability) {
      router.push(`/members/${event.createdBy}`);
      return;
    }
    startTransition(() => {
      if (isParticipant) {
        if (!soleParticipant) leaveEvent(event.id);
      } else {
        joinEvent(event.id);
      }
    });
  }

  const time = event.startTime.slice(0, 5);
  const title = event.title || event.communities.map((c) => c.label).join(", ") || t("event.defaultTitle");
  const who =
    event.participants.length > 0
      ? event.participants.map((p) => p.displayName).join(", ")
      : t("event.noParticipant");

  return (
    <div className={`event-card ${isAvailability ? "avail-card" : ""}`} onClick={onOpen}>
      <div className="top">
        <div className="top-left">
          <span className="time">{time}</span>
          {!isAvailability && (
            <span className={`tag ${hasKeyHolder ? "ok" : "warn"}`}>
              {hasKeyHolder ? "🔑" : "⚠"}
            </span>
          )}
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
        {isAvailability ? (
          <button type="button" className="join-btn gray" onClick={toggleJoin}>
            {t("event.contact")}
          </button>
        ) : (
          <button
            type="button"
            className={`join-btn ${isParticipant ? "gray" : ""}`}
            onClick={toggleJoin}
            disabled={pending || soleParticipant}
          >
            {isParticipant ? t("event.joined") : t("event.join")}
          </button>
        )}
      </div>
    </div>
  );
}
