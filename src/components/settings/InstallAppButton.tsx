"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Bouton d'installation PWA (CDC 14.4). `beforeinstallprompt` (Android/desktop
// Chrome, Edge) ne se déclenche qu'une fois et doit être capturé tôt puis
// rejoué au clic — il n'existe pas du tout sur iOS Safari, qui n'expose aucune
// installation programmatique : on y affiche à la place la marche à suivre
// manuelle (Partager > Sur l'écran d'accueil).
export function InstallAppButton() {
  const { t } = useT();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function handleClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferredPrompt(null);
      return;
    }
    setHint(isIos ? t("settings.installApp.ios") : t("settings.installApp.unavailable"));
  }

  return (
    <>
      <button
        type="button"
        className="modal-join"
        style={{ marginTop: 0, marginBottom: hint ? 8 : 14 }}
        onClick={handleClick}
      >
        {t("settings.installApp")}
      </button>
      {hint && <p className="field-note" style={{ marginTop: 0, marginBottom: 14 }}>{hint}</p>}
    </>
  );
}
