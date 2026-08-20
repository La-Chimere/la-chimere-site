"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AvatarCircle } from "@/components/ui/AvatarCircle";
import { BellIcon, LogoIcon } from "@/components/ui/icons";
import { signOut } from "@/lib/auth-actions";
import { useT } from "@/components/i18n/LocaleProvider";

interface HeaderProps {
  displayName: string;
  photoUrl?: string | null;
  hasUnreadNotifications: boolean;
}

// En-tête : logo + nom du club (retour Programme), cloche (Annonces/
// Notifications), avatar + menu déroulant (CDC 12.2/14.1).
export function Header({ displayName, photoUrl, hasUnreadNotifications }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useT();
  const onAnnouncements = pathname?.startsWith("/announcements");

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <header className="topbar">
      <button
        className="brand"
        type="button"
        title={t("header.backToProgramme")}
        onClick={() => router.push("/programme")}
      >
        <span className="logo-mark" aria-hidden="true">
          <LogoIcon />
        </span>
        <span className="brand-name">La Chimère</span>
      </button>

      <Link
        href="/announcements"
        className={`bell-btn ${onAnnouncements ? "active" : ""}`}
        title={t("header.announcements")}
      >
        <BellIcon />
        <span className={`bell-dot ${hasUnreadNotifications ? "show" : ""}`} />
      </Link>

      <div className="account-wrap" ref={wrapRef}>
        <button
          className="avatar-btn"
          onClick={() => setOpen((v) => !v)}
          aria-label={t("header.accountMenu")}
          style={
            photoUrl
              ? { backgroundImage: `url(${photoUrl})`, color: "transparent" }
              : undefined
          }
        >
          {!photoUrl && initials(displayName)}
        </button>
        <div className={`dropdown ${open ? "open" : ""}`}>
          <div className="acc-head">
            <AvatarCircle name={displayName} photoUrl={photoUrl} size="header" />
            <div>
              <div className="acc-name">{displayName}</div>
            </div>
          </div>
          <Link href="/profile" className="acc-item" onClick={() => setOpen(false)}>
            {t("header.myProfile")}
          </Link>
          <Link href="/keys" className="acc-item" onClick={() => setOpen(false)}>
            {t("header.theKeys")}
          </Link>
          <Link href="/settings" className="acc-item" onClick={() => setOpen(false)}>
            {t("header.settings")}
          </Link>
          <Link href="/faq" className="acc-item" onClick={() => setOpen(false)}>
            {t("header.faq")}
          </Link>
          <Link href="/cgu" className="acc-item" onClick={() => setOpen(false)}>
            {t("header.terms")}
          </Link>
          <div className="acc-divider" />
          <form action={signOut}>
            <button type="submit" className="acc-item danger">
              {t("header.logout")}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}
