"use client";

import { useState, useTransition } from "react";
import { Fab } from "@/components/ui/Fab";
import { DangerConfirmButton } from "@/components/ui/DangerConfirmButton";
import { AnnouncementCard } from "@/components/announcements/AnnouncementCard";
import { NotificationCard } from "@/components/announcements/NotificationCard";
import { AnnouncementForm } from "@/components/announcements/AnnouncementForm";
import {
  deleteAllNotifications,
  markAllAnnouncementsSeen,
  markAllNotificationsRead,
} from "@/lib/announcements-actions";
import type { Announcement, NotificationItem } from "@/lib/announcements-types";
import type { CommunityOption } from "@/lib/events-types";
import { useT } from "@/components/i18n/LocaleProvider";
import { CheckCircleIcon, TrashIcon } from "@/components/ui/icons";

interface AnnouncementsClientProps {
  announcements: Announcement[];
  notifications: NotificationItem[];
  communities: CommunityOption[];
  isAdmin: boolean;
  currentUserId: string;
}

export function AnnouncementsClient({
  announcements,
  notifications,
  communities,
  isAdmin,
}: AnnouncementsClientProps) {
  const { t } = useT();
  const [, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  const hasUnreadNotifications = notifications.some((n) => !n.read);

  return (
    <div className="page">
      <div className="an-section-head">
        <h1 className="page-title">{t("announcements.title")}</h1>
        <div className="an-section-actions">
          <button
            type="button"
            className="icon-btn"
            disabled={announcements.every((a) => a.seen)}
            onClick={() =>
              startTransition(() => markAllAnnouncementsSeen(announcements.map((a) => a.id)))
            }
            aria-label={t("announcements.markAllSeen")}
            title={t("announcements.markAllSeen")}
          >
            <CheckCircleIcon />
          </button>
        </div>
      </div>

      {announcements.length === 0 ? (
        <p className="empty-hint">{t("announcements.none")}</p>
      ) : (
        announcements.map((a) => (
          <AnnouncementCard
            key={a.id}
            announcement={a}
            isAdmin={isAdmin}
            onEdit={() => {
              setEditing(a);
              setFormOpen(true);
            }}
          />
        ))
      )}

      <div className="an-section-head">
        <h1 className="page-title">{t("notifications.title")}</h1>
        <div className="an-section-actions">
          <button
            type="button"
            className="icon-btn"
            disabled={!hasUnreadNotifications}
            onClick={() => startTransition(() => markAllNotificationsRead())}
            aria-label={t("notifications.markAllRead")}
            title={t("notifications.markAllRead")}
          >
            <CheckCircleIcon />
          </button>
          <DangerConfirmButton
            className="icon-btn danger"
            disabled={notifications.length === 0}
            onConfirm={() => startTransition(() => deleteAllNotifications())}
            title={t("notifications.clearAll")}
          >
            <TrashIcon />
          </DangerConfirmButton>
        </div>
      </div>

      {notifications.length === 0 ? (
        <p className="empty-hint">{t("notifications.none")}</p>
      ) : (
        notifications.map((n) => <NotificationCard key={n.id} notification={n} />)
      )}

      {isAdmin && (
        <Fab
          id="annFabBtn"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          title={t("announcementForm.fabTitle")}
        />
      )}

      <AnnouncementForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        communities={communities}
        editing={editing}
      />
    </div>
  );
}
