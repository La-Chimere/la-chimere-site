-- Corrige deux clés étrangères posées sans ON DELETE (migration 0013) :
-- supprimer une ligue échouait silencieusement si un évènement ou une
-- annonce la référençait encore, la contrainte bloquant le DELETE côté
-- Postgres (remonté en test).

alter table events drop constraint events_league_match_id_fkey;
alter table events add constraint events_league_match_id_fkey
  foreign key (league_match_id) references league_matches(id) on delete set null;

alter table announcements drop constraint announcements_target_league_id_fkey;
alter table announcements add constraint announcements_target_league_id_fkey
  foreign key (target_league_id) references leagues(id) on delete cascade;
