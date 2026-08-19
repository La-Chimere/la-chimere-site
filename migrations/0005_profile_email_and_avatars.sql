-- La Chimère — email de profil (optionnel) + bucket de stockage des avatars
-- Le schéma initial a une colonne email_visible mais pas de colonne email
-- elle-même (oubli du schéma initial) — nécessaire pour CDC 4.1 (email
-- optionnel, sert à la récupération de mot de passe).

alter table profiles add column email text;

-- Bucket public pour les photos de profil (CDC 13.4/14.2). Chaque membre ne
-- peut écrire que dans son propre dossier ("<uid>/..."), la lecture est
-- publique (nécessaire pour afficher les avatars sans authentification côté
-- CDN/navigateur).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_own_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_own_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_own_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
