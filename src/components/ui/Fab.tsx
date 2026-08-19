"use client";

import { type ButtonHTMLAttributes } from "react";
import { useT } from "@/components/i18n/LocaleProvider";

export function Fab(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { t } = useT();
  return (
    <button type="button" className="fab" aria-label={t("common.create")} {...props}>
      +
    </button>
  );
}
