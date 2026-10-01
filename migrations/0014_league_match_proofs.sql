-- Phase 2 des ligues : preuve photo d'un match (capture de l'appli
-- Warhammer 40,000 qui fait foi sur le score). Contrairement aux avatars,
-- ce bucket n'est PAS public : seuls les deux joueurs du match et
-- l'organisateur de sa ligue doivent pouvoir la voir (demande explicite,
-- différent du pattern avatars_public_read de la migration 0005).

alter table league_matches add column proof_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('league-match-proofs', 'league-match-proofs', false, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Convention de chemin : "<match_id>/proof.jpg" — (storage.foldername(name))[1]
-- donne le match_id, on vérifie ensuite que l'appelant est l'un des deux
-- joueurs de ce match ou l'organisateur de sa ligue (is_league_organizer()
-- vient de la migration 0013).
create policy "league_match_proofs_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'league-match-proofs'
    and exists (
      select 1 from league_matches m
      where m.id::text = (storage.foldername(name))[1]
        and (
          m.player_a_id = auth.uid()
          or m.player_b_id = auth.uid()
          or is_league_organizer((select league_id from league_divisions where id = m.division_id))
        )
    )
  );

create policy "league_match_proofs_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'league-match-proofs'
    and exists (
      select 1 from league_matches m
      where m.id::text = (storage.foldername(name))[1]
        and (
          m.player_a_id = auth.uid()
          or m.player_b_id = auth.uid()
          or is_league_organizer((select league_id from league_divisions where id = m.division_id))
        )
    )
  );

create policy "league_match_proofs_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'league-match-proofs'
    and exists (
      select 1 from league_matches m
      where m.id::text = (storage.foldername(name))[1]
        and (
          m.player_a_id = auth.uid()
          or m.player_b_id = auth.uid()
          or is_league_organizer((select league_id from league_divisions where id = m.division_id))
        )
    )
  );

create policy "league_match_proofs_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'league-match-proofs'
    and exists (
      select 1 from league_matches m
      where m.id::text = (storage.foldername(name))[1]
        and (
          m.player_a_id = auth.uid()
          or m.player_b_id = auth.uid()
          or is_league_organizer((select league_id from league_divisions where id = m.division_id))
        )
    )
  );
