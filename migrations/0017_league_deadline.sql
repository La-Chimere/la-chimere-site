-- Date limite purement informative (CDC league) : aucun impact
-- fonctionnel, juste modifiable par l'organisateur et affichée aux
-- participants (aperçu Leaderboard + page ligue).
alter table leagues add column results_deadline date;
