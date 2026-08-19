"use client";

import { useTransition } from "react";
import { toggleAnnouncementSeen } from "@/lib/announcements-actions";
import { PollWidget } from "@/components/announcements/PollWidget";
import type { Announcement } from "@/lib/announcements-types";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useT } from "@/components/i18n/LocaleProvider";

interface AnnouncementCardProps {
  announcement: Announcement;
  isAdmin: boolean;
  onEdit: () => void;
}

export function AnnouncementCard({ announcement: a, isAdmin, onEdit }: AnnouncementCardProps) {
  const { t, locale } = useT();
  const [pending, startTransition] = useTransition();
  const date = new Date(a.announcementDate);
  const dfnsLocale = locale === "en" ? enUS : fr;

  return (
    <div className="ann-card section-card" onClick={isAdmin ? onEdit : undefined} style={isAdmin ? { cursor: "pointer" } : undefined}>
      <div className="ann-date">
        <span className="d">{format(date, "d")}</span>
        <span className="m">{format(date, "MMM", { locale: dfnsLocale }).replace(".", "")}</span>
      </div>
      <div className="ann-body">
        <div className="t">
          {a.banner && <span className="ann-alert-icon">🔊</span>}
          {a.title}
          {a.targetCommunityLabel && <span className="audience-badge">{a.targetCommunityLabel}</span>}
        </div>
        <div className="d2">{a.description}</div>
        {a.poll && (
          <div onClick={(e) => e.stopPropagation()}>
            <PollWidget poll={a.poll} isAdmin={isAdmin} />
          </div>
        )}
      </div>
      <button
        type="button"
        className={`ann-dot ${!a.seen ? "unread" : ""}`}
        disabled={pending}
        onClick={(e) => {
          e.stopPropagation();
          startTransition(() => toggleAnnouncementSeen(a.id, !a.seen));
        }}
        aria-label={a.seen ? t("announcements.markUnread") : t("announcements.markRead")}
      />
    </div>
  );
}
