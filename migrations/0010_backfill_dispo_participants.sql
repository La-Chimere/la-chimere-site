-- Corrige des données de démo insérées directement en base : des parties
-- spontanées / disponibilités sans aucune ligne event_participants, ce qui
-- n'est fonctionnellement pas possible (une dispo doit être rattachée à son
-- créateur). Rattrape toute ligne events sans participant en y ajoutant son
-- créateur (idempotent — sans effet si déjà correct).
insert into event_participants (event_id, profile_id)
select e.id, e.created_by
from events e
where not exists (
  select 1 from event_participants ep where ep.event_id = e.id
);
