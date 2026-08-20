"use client";

import { useTransition } from "react";
import { deleteNotification, markNotificationRead } from "@/lib/announcements-actions";
import type { NotificationItem } from "@/lib/announcements-types";
import { useT } from "@/components/i18n/LocaleProvider";

interface NotificationCardProps {
  notification: NotificationItem;
}

export function NotificationCard({ notification: n }: NotificationCardProps) {
  const { t } = useT();
  const [pending, startTransition] = useTransition();

  return (
    <div className="notif-card">
      <button
        type="button"
        className="notif-close"
        disabled={pending}
        onClick={() => startTransition(() => deleteNotification(n.id))}
        aria-label={t("common.delete")}
        title={t("common.delete")}
      >
        ×
      </button>
      <span>{n.message}</span>
      <button
        type="button"
        className={`notif-dot ${!n.read ? "unread" : ""}`}
        disabled={pending}
        onClick={() => startTransition(() => markNotificationRead(n.id, !n.read))}
        aria-label={n.read ? t("announcements.markUnread") : t("announcements.markRead")}
        title={n.read ? t("announcements.markUnread") : t("announcements.markRead")}
      />
    </div>
  );
}
