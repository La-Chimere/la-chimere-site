// "Dernière partie aujourd'hui / hier / il y a X jours" (CDC 12.8/12.11) —
// prend un `t` (depuis useT() ou serverT) pour rester agnostique du contexte
// client/serveur.
export function formatActivity(
  t: (key: string, params?: Record<string, string | number>) => string,
  days: number | null,
): string {
  if (days === null) return t("activity.none");
  if (days <= 0) return t("activity.today");
  if (days === 1) return t("activity.yesterday");
  return t("activity.daysAgo", { n: days });
}
