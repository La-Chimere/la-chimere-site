-- Centralise le règlement sur UNE seule description par ligue (texte libre,
-- modifiable par l'organisateur, visible en lecture seule par les
-- participants) plutôt qu'un règlement dupliqué par division.

alter table leagues add column description text;
alter table league_divisions drop column rules;
