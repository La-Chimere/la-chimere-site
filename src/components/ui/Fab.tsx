"use client";

import { type ButtonHTMLAttributes } from "react";
import { useT } from "@/components/i18n/LocaleProvider";

export function Fab({ title, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { t } = useT();
  const label = title ?? t("common.create");
  return (
    <button type="button" className="fab" aria-label={label} title={label} {...props}>
      +
    </button>
  );
}
