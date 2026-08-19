"use client";

import { useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";

interface AlertBannerProps {
  text: string;
}

export function AlertBanner({ text }: AlertBannerProps) {
  const { t } = useT();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="announce">
      <span className="txt">{text}</span>
      <button type="button" onClick={() => setDismissed(true)} aria-label={t("common.hide")}>
        ×
      </button>
    </div>
  );
}
