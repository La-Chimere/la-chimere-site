"use client";

import { useTransition } from "react";
import { deleteNotification, markNotificationRead } from "@/lib/announcements-actions";
import type { NotificationItem } from "@/lib/announcements-types";

interface NotificationCardProps {
  notification: NotificationItem;
}

export function NotificationCard({ notification: n }: NotificationCardProps) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="notif-card">
      <button
        type="button"
        className="notif-close"
        disabled={pending}
        onClick={() => startTransition(() => deleteNotification(n.id))}
        aria-label="Supprimer"
      >
        ×
      </button>
      <span>{n.message}</span>
      <button
        type="button"
        className={`notif-dot ${!n.read ? "unread" : ""}`}
        disabled={pending}
        onClick={() => startTransition(() => markNotificationRead(n.id, !n.read))}
        aria-label={n.read ? "Marquer non lu" : "Marquer lu"}
      />
    </div>
  );
}
