"use client";

import { useRouter } from "next/navigation";
import { BackArrowIcon } from "@/components/ui/icons";
import { useT } from "@/components/i18n/LocaleProvider";

// Revient à la page précédente (historique du navigateur) plutôt que de
// toujours ramener vers Programme, quelle que soit la sous-page d'où l'on vient.
export function BackButton() {
  const router = useRouter();
  const { t } = useT();
  return (
    <button type="button" className="subpage-back" onClick={() => router.back()}>
      <BackArrowIcon /> {t("common.back")}
    </button>
  );
}
