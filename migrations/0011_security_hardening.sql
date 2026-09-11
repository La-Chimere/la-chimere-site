-- Durcissement sécurité avant l'ouverture aux ~60 membres réels (audit
-- pré-démo comité). Chaque bloc corrige un point précis, indépendant des
-- autres.

-- 1. Empêche deux comptes de ne différer que par la casse du pseudo. La
-- connexion par pseudo (CDC 4.1) résout le compte via .ilike(), donc un
-- doublon "Alice"/"alice" bloquerait la connexion des DEUX comptes (la
-- recherche renverrait deux lignes). La contrainte unique existante sur
-- display_name est sensible à la casse et ne le détecte pas.
create unique index profiles_display_name_lower_idx on profiles (lower(display_name));

-- 2. login_slug manquait du déclencheur anti-auto-élévation (migration
-- 0001) : un membre pouvait le modifier/vider lui-même sur sa propre ligne
-- (autorisé par profiles_update_own) et perdre l'accès à son compte sans
-- recours admin, l'email de connexion synthétique dépendant de ce slug. On
-- en profite pour fixer le search_path de la fonction (recommandation
-- standard pour les fonctions security definer).
create or replace function prevent_privileged_self_update()
returns trigger as $$
begin
  if auth.role() <> 'service_role' then
    if new.is_admin is distinct from old.is_admin
       or new.is_super_admin is distinct from old.is_super_admin
       or new.has_key is distinct from old.has_key
       or new.has_exit_key is distinct from old.has_exit_key
       or new.status is distinct from old.status
       or new.login_slug is distinct from old.login_slug then
      raise exception 'Modification de champ réservé aux administrateurs (via service_role uniquement)';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- 3. La policy UPDATE des events n'avait qu'un USING, pas de WITH CHECK :
-- un membre pouvait créer une partie "spontanée" (autorisé) puis la
-- repasser en "officiel" via une requête PATCH directe, contournant la
-- restriction "officiel réservé aux admins" de la policy INSERT.
drop policy if exists "events_update_own_or_admin" on events;
create policy "events_update_own_or_admin"
  on events for update
  to authenticated
  using (
    created_by = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  )
  with check (
    type <> 'officiel'
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );

-- 4. Le bucket "avatars" n'avait ni limite de taille ni restriction de type
-- MIME (seul le contrôle client existait, contournable). Sans ça, n'importe
-- quel compte peut déposer un fichier arbitraire (taille, type) dans son
-- propre dossier.
update storage.buckets
set file_size_limit = 2097152, -- 2 Mo
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'avatars';

-- 5. club_settings (dont building_code, le code de la porte du local) était
-- lisible par tout compte authentifié, y compris un compte "pending" — le
-- statut "en attente de validation" n'est qu'un écran côté app (voir
-- (app)/layout.tsx), pas une règle RLS.
drop policy if exists "club_settings_select_authenticated" on club_settings;
create policy "club_settings_select_active"
  on club_settings for select
  to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.status = 'active'));

-- 6. La page d'inscription (publique, non authentifiée) utilisait le client
-- service_role juste pour compter les membres par communauté à afficher
-- pendant le choix des jeux — en violation du principe "service_role
-- uniquement après vérification explicite" du reste du code. Remplacé par
-- une fonction dédiée qui n'expose que l'agrégat (aucune ligne individuelle,
-- donc aucune fuite de qui joue à quoi).
create or replace function get_community_member_counts()
returns table(community_id uuid, member_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select community_id, count(*) as member_count
  from profile_communities
  group by community_id;
$$;
grant execute on function get_community_member_counts() to anon, authenticated;
