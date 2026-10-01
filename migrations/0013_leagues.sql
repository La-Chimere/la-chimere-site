-- Ligues communautaires (phase 1 : formats "poule" et "libre" uniquement —
-- "championnat" et "ronde suisse" suivront dans une migration dédiée une fois
-- la mécanique par rounds nécessaire pour ces deux formats construite).
-- Une ligue appartient à une communauté, se découpe en divisions ("Ligue 1",
-- "Ligue 2"...), chacune avec son propre règlement en texte libre et son
-- propre barème de points (modifiable par l'organisateur à tout moment, y
-- compris après des résultats déjà saisis — le classement est recalculé à
-- la volée, les matchs déjà joués ne sont jamais régénérés).

-- ============================================================================
-- PROFILES.can_create_leagues (droit accordé par un admin, CDC league)
-- Posé en premier : référencé par la policy leagues_insert ci-dessous.
-- ============================================================================
alter table profiles add column can_create_leagues boolean not null default false;

-- Protège can_create_leagues contre l'auto-élévation, comme les autres
-- champs réservés (voir migrations 0001 et 0011 pour l'historique de cette
-- fonction).
create or replace function prevent_privileged_self_update()
returns trigger as $$
begin
  if auth.role() <> 'service_role' then
    if new.is_admin is distinct from old.is_admin
       or new.is_super_admin is distinct from old.is_super_admin
       or new.has_key is distinct from old.has_key
       or new.has_exit_key is distinct from old.has_exit_key
       or new.status is distinct from old.status
       or new.login_slug is distinct from old.login_slug
       or new.can_create_leagues is distinct from old.can_create_leagues then
      raise exception 'Modification de champ réservé aux administrateurs (via service_role uniquement)';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================================================
-- LEAGUES
-- ============================================================================
create table leagues (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities(id),
  name text not null,
  format text not null check (format in ('poule', 'libre')),
  status text not null default 'draft' check (status in ('draft', 'active', 'closed')),
  points_win int not null default 3,
  points_tie int not null default 1,
  points_loss int not null default 0,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

alter table leagues enable row level security;

create policy "leagues_select_authenticated"
  on leagues for select
  to authenticated
  using (true);

-- Réservé aux admins et aux membres explicitement autorisés par un admin
-- (profiles.can_create_leagues) — voir CDC league : un responsable de ligue
-- n'est pas nécessairement du comité.
create policy "leagues_insert"
  on leagues for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and (p.is_admin or p.can_create_leagues)
    )
  );

-- ============================================================================
-- LEAGUE_ORGANIZERS (rôle scopé à UNE ligue précise, distinct de is_admin)
-- ============================================================================
create table league_organizers (
  league_id uuid not null references leagues(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  primary key (league_id, profile_id)
);

alter table league_organizers enable row level security;

create policy "league_organizers_select_authenticated"
  on league_organizers for select
  to authenticated
  using (true);

-- Un membre peut s'auto-ajouter comme organisateur UNIQUEMENT d'une ligue
-- qu'il vient de créer lui-même (created_by) ; un admin peut ajouter
-- n'importe qui (ex. un co-organisateur demandé après coup).
create policy "league_organizers_insert"
  on league_organizers for insert
  to authenticated
  with check (
    (profile_id = auth.uid() and exists (
      select 1 from leagues l where l.id = league_id and l.created_by = auth.uid()
    ))
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "league_organizers_delete_admin"
  on league_organizers for delete
  to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));

-- Fonction utilitaire : admin OU organisateur désigné de cette ligue.
-- security definer + search_path fixé, même convention que
-- get_community_member_counts() (migration 0011).
create or replace function is_league_organizer(target_league_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from league_organizers lo
      where lo.league_id = target_league_id and lo.profile_id = auth.uid()
    )
    or exists (
      select 1 from profiles p where p.id = auth.uid() and p.is_admin
    );
$$;

-- Permet à leagues_update/delete de réutiliser is_league_organizer().
create policy "leagues_update"
  on leagues for update
  to authenticated
  using (is_league_organizer(id));

create policy "leagues_delete"
  on leagues for delete
  to authenticated
  using (is_league_organizer(id));

-- ============================================================================
-- LEAGUE_DIVISIONS ("Ligue 1", "Ligue 2"... avec règlement propre)
-- ============================================================================
create table league_divisions (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  name text not null,
  rank int not null, -- 1 = niveau le plus haut (ordre d'affichage + montées/descentes futures)
  rules text
);

alter table league_divisions enable row level security;

create policy "league_divisions_select_authenticated"
  on league_divisions for select
  to authenticated
  using (true);

create policy "league_divisions_manage"
  on league_divisions for all
  to authenticated
  using (is_league_organizer(league_id))
  with check (is_league_organizer(league_id));

-- ============================================================================
-- LEAGUE_PARTICIPANTS (joueur inscrit dans une division pour la saison + armée)
-- ============================================================================
create table league_participants (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null references league_divisions(id) on delete cascade,
  profile_id uuid not null references profiles(id),
  army text,
  unique (division_id, profile_id)
);

alter table league_participants enable row level security;

create policy "league_participants_select_authenticated"
  on league_participants for select
  to authenticated
  using (true);

create policy "league_participants_insert"
  on league_participants for insert
  to authenticated
  with check (is_league_organizer((select league_id from league_divisions where id = division_id)));

create policy "league_participants_delete"
  on league_participants for delete
  to authenticated
  using (is_league_organizer((select league_id from league_divisions where id = division_id)));

-- Le joueur peut modifier sa propre ligne (en pratique : son armée),
-- l'organisateur peut tout corriger (ex. réassigner une division autrement,
-- bien que l'app passe plutôt par delete+insert pour ce cas-là).
create policy "league_participants_update"
  on league_participants for update
  to authenticated
  using (
    profile_id = auth.uid()
    or is_league_organizer((select league_id from league_divisions where id = division_id))
  );

-- ============================================================================
-- LEAGUE_MATCHES (le "fixture" entre deux joueurs d'une même division)
-- ============================================================================
create table league_matches (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null references league_divisions(id) on delete cascade,
  player_a_id uuid not null references profiles(id),
  player_b_id uuid not null references profiles(id),
  score_a int check (score_a between 0 and 100),
  score_b int check (score_b between 0 and 100),
  reported_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  check (player_a_id <> player_b_id)
);

alter table league_matches enable row level security;

create policy "league_matches_select_authenticated"
  on league_matches for select
  to authenticated
  using (true);

create policy "league_matches_insert"
  on league_matches for insert
  to authenticated
  with check (is_league_organizer((select league_id from league_divisions where id = division_id)));

create policy "league_matches_delete"
  on league_matches for delete
  to authenticated
  using (is_league_organizer((select league_id from league_divisions where id = division_id)));

-- N'importe lequel des deux joueurs peut saisir le résultat de son propre
-- match (même logique de confiance que event_participants_update pour le
-- V/E/D), l'organisateur peut corriger n'importe quel match de sa ligue.
create policy "league_matches_update"
  on league_matches for update
  to authenticated
  using (
    player_a_id = auth.uid()
    or player_b_id = auth.uid()
    or is_league_organizer((select league_id from league_divisions where id = division_id))
  );

-- ============================================================================
-- Liaison avec les tables existantes
-- ============================================================================

-- Un évènement planifié normalement peut accomplir un match de ligue
-- (facilité de planification côté Programme) ; le score/la source de vérité
-- restent sur league_matches, jamais recalculés depuis events.
alter table events add column league_match_id uuid references league_matches(id);

-- Ciblage d'annonce sur les participants d'une ligue précise, en plus du
-- ciblage par communauté existant (les deux colonnes sont mutuellement
-- exclusives côté application, pas contraint en base pour rester simple).
alter table announcements add column target_league_id uuid references leagues(id);
