-- Phase 3 des ligues : formats "suisse" et "championnat", qui fonctionnent
-- par rounds (contrairement à "poule"/"libre" qui n'en ont pas besoin) —
-- voir migration 0013 pour le contexte général.

alter table leagues drop constraint if exists leagues_format_check;
alter table leagues add constraint leagues_format_check
  check (format in ('poule', 'libre', 'suisse', 'championnat'));

-- Round auquel appartient un match (uniquement pertinent pour suisse/
-- championnat ; reste null pour poule/libre). Un round n'est généré que
-- lorsque le précédent est entièrement complété (vérifié côté application,
-- cf. generateNextRound dans league-actions.ts).
alter table league_matches add column round int;
