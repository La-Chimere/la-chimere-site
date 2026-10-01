// Règle de visibilité d'une annonce, partagée entre announcements/page.tsx
// (liste complète) et (app)/layout.tsx (bandeau d'alerte + compteur de
// notifications non lues) — ces deux derniers calculaient avant un
// "non lu"/bandeau sans tenir compte du ciblage communauté/ligue, les
// montrant par erreur à tout le monde (CDC league : bug remonté en test).
export function isAnnouncementVisibleTo(
  targetCommunityId: string | null,
  targetLeagueId: string | null,
  isAdmin: boolean,
  myCommunityIds: Set<string>,
  myLeagueIds: Set<string>,
): boolean {
  if (isAdmin) return true;
  if (targetLeagueId) return myLeagueIds.has(targetLeagueId);
  return !targetCommunityId || myCommunityIds.has(targetCommunityId);
}
