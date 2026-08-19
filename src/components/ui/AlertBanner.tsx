"use client";

import { useState } from "react";

interface AlertBannerProps {
  text: string;
}

export function AlertBanner({ text }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="announce">
      <span className="txt">{text}</span>
      <button type="button" onClick={() => setDismissed(true)} aria-label="Masquer">
        ×
      </button>
    </div>
  );
}
