"use client";

import { useEffect, useState, useTransition } from "react";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { DangerConfirmButton } from "@/components/ui/DangerConfirmButton";
import { MemberPicker, type PickableMember } from "@/components/ui/MemberPicker";
import { deleteOwnAccount, updateNotificationPrefs } from "@/lib/profile-actions";
import { setAdminRole } from "@/lib/admin-actions";
import { useT } from "@/components/i18n/LocaleProvider";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";

const ACCENTS = ["#3F6EA5", "#2F8F5A", "#B4533F", "#7B5EA7", "#B4862F", "#3F8FA0"];

const NOTIF_TYPES: { key: string; labelKey: string }[] = [
  { key: "key_missing", labelKey: "settings.notif.keyMissing" },
  { key: "new_announcement", labelKey: "settings.notif.newAnnouncement" },
  { key: "added_to_event", labelKey: "settings.notif.addedToEvent" },
];

interface SettingsClientProps {
  notificationPrefs: Record<string, boolean>;
  isSuperAdmin: boolean;
  admins: PickableMember[];
  nonAdmins: PickableMember[];
}

export function SettingsClient({
  notificationPrefs,
  isSuperAdmin,
  admins,
  nonAdmins,
}: SettingsClientProps) {
  const { t } = useT();
  const [, startTransition] = useTransition();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [prefs, setPrefs] = useState(notificationPrefs);
  const [newAdmin, setNewAdmin] = useState<PickableMember[]>([]);

  useEffect(() => {
    // Lecture d'un système externe (localStorage) au montage, pas
    // disponible côté serveur — ne peut pas être fait dans un initialiseur
    // de useState sans provoquer un mismatch d'hydratation SSR.
    const storedTheme = localStorage.getItem("chimere-theme");
    const storedAccent = localStorage.getItem("chimere-accent");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (storedTheme === "light" || storedTheme === "dark") setTheme(storedTheme);
    if (storedAccent) setAccent(storedAccent);
  }, []);

  function applyTheme(next: "light" | "dark") {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("chimere-theme", next);
  }

  function applyAccent(next: string) {
    setAccent(next);
    document.documentElement.style.setProperty("--accent", next);
    localStorage.setItem("chimere-accent", next);
  }

  function togglePref(key: string) {
    const next = { ...prefs, [key]: !(prefs[key] ?? true) };
    setPrefs(next);
    startTransition(() => updateNotificationPrefs(next));
  }

  return (
    <div className="page">
      <div className="subpage-back-row">
        <a href="/programme" className="subpage-back">
          ‹ {t("common.back")}
        </a>
      </div>

      <div className="section-subtitle">{t("settings.appearance")}</div>
      <div className="section-card">
        <div className="segmented" style={{ marginBottom: 16 }}>
          <button type="button" className={theme === "light" ? "active" : ""} onClick={() => applyTheme("light")}>
            {t("settings.light")}
          </button>
          <button type="button" className={theme === "dark" ? "active" : ""} onClick={() => applyTheme("dark")}>
            {t("settings.dark")}
          </button>
        </div>
        <div className="form-label">{t("settings.accentColor")}</div>
        <div className="accent-swatches">
          {ACCENTS.map((c) => (
            <button
              key={c}
              type="button"
              className={`accent-swatch ${accent === c ? "selected" : ""}`}
              style={{ background: c }}
              onClick={() => applyAccent(c)}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      <div className="section-subtitle">{t("settings.application")}</div>
      <div className="section-card">
        <button type="button" className="modal-btn outline modal-btn-full" style={{ marginBottom: 14 }}>
          {t("settings.installApp")}
        </button>
        <div className="form-label">{t("settings.language")}</div>
        <LanguageToggle />
      </div>

      <div className="section-subtitle">{t("notifications.title")}</div>
      <div className="section-card">
        {NOTIF_TYPES.map((n) => (
          <div className="field-head" key={n.key} style={{ marginBottom: 12 }}>
            <span>{t(n.labelKey)}</span>
            <ToggleSwitch on={prefs[n.key] ?? true} onChange={() => togglePref(n.key)} />
          </div>
        ))}
      </div>

      <div className="section-subtitle">{t("settings.account")}</div>
      <div className="section-card">
        <DangerConfirmButton
          className="modal-btn danger modal-btn-full"
          confirmLabel={t("settings.deleteAccountConfirm")}
          onConfirm={() => startTransition(() => deleteOwnAccount())}
        >
          {t("settings.deleteAccount")}
        </DangerConfirmButton>
      </div>

      {isSuperAdmin && (
        <>
          <div className="section-subtitle">{t("settings.admins")}</div>
          <div className="section-card">
            <div className="admin-add-key-row">
              <div style={{ flex: 1 }}>
                <MemberPicker members={nonAdmins} selected={newAdmin} onChange={setNewAdmin} />
              </div>
              <button
                type="button"
                className="join-btn small"
                disabled={newAdmin.length === 0}
                onClick={() => {
                  startTransition(() => setAdminRole(newAdmin[0].id, true));
                  setNewAdmin([]);
                }}
              >
                {t("settings.makeAdmin")}
              </button>
            </div>
            <div className="section-subtitle" style={{ fontSize: 12, marginTop: 12 }}>
              {t("settings.currentAdmins")}
            </div>
            {admins.map((a) => (
              <div className="admin-row reverse" key={a.id}>
                <button
                  type="button"
                  className="join-btn gray small"
                  onClick={() => startTransition(() => setAdminRole(a.id, false))}
                >
                  {t("common.remove")}
                </button>
                <span className="name">{a.displayName}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
