-- La Chimère — corrige la clé primaire de poll_votes
-- Le schéma initial utilisait (poll_id, profile_id, option_id) comme clé
-- primaire composite. Or une primary key interdit toute colonne NULL parmi
-- ses composantes, alors qu'un vote de type "évaluation" (rating) n'a pas
-- d'option_id (pas de poll_options pour ce type). Remplacé par une clé
-- technique ; l'application gère elle-même le remplacement d'un vote
-- existant (suppression puis insertion) plutôt que de s'appuyer sur une
-- contrainte d'unicité stricte en base.

alter table poll_votes drop constraint poll_votes_pkey;
alter table poll_votes add column id uuid primary key default gen_random_uuid();
