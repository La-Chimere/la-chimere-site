"use client";

import { useEffect } from "react";

const STORAGE_THEME = "chimere-theme";
const STORAGE_ACCENT = "chimere-accent";

// Applique le thème clair/sombre et la couleur d'accent choisis par le membre
// (persistés en local pour l'instant ; la page Paramètres, cf. CDC 14.4,
// écrira plus tard ce choix en base pour qu'il suive le membre d'un appareil
// à l'autre). Par défaut : thème clair, accent Saphir (#3F6EA5).
export function ThemeInit() {
  useEffect(() => {
    const theme = localStorage.getItem(STORAGE_THEME);
    const accent = localStorage.getItem(STORAGE_ACCENT);
    if (theme === "light" || theme === "dark") {
      document.documentElement.dataset.theme = theme;
    }
    if (accent) {
      document.documentElement.style.setProperty("--accent", accent);
    }
  }, []);

  return null;
}
