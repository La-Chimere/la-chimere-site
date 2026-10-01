-- Restreint le bucket des preuves de match aux formats image jpeg/png
-- uniquement (demande explicite : le webp n'était pas souhaité).

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png']
where id = 'league-match-proofs';
