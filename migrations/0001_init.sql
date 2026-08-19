-- La Chimère — schéma initial (POC)
-- Référence : cahier des charges v0.9, section 7 (modèle de données) et annexe 12.
-- Convention : chaque table a RLS activé. Les actions "administrateur" (créer un
-- évènement officiel, gérer les clés, supprimer un compte, gérer les communautés,
-- les annonces/sondages) passent par des routes serveur utilisant la clé service_role,
-- qui contourne RLS — donc pas besoin de policies "admin" complexes pour ces cas-là,
-- seulement de bloquer l'auto-élévation de droits par un client normal.

-- ============================================================================
-- COMMUNITIES (= étiquettes de jeu = communautés, voir CDC 12.3/12.8 : mêmes tags)
-- ============================================================================
create table communities (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,              -- slug technique, ex: 'necromunda'
  label text not null,                   -- libellé affiché, ex: 'Necromunda'
  hidden boolean not null default false, -- masquée par un admin (12.9)
  competitive boolean not null default true, -- volet compétitif (12.9)
  created_at timestamptz not null default now()
);

alter table communities enable row level security;

create policy "communities_select_authenticated"
  on communities for select
  to authenticated
  using (true);

-- ============================================================================
-- PROFILES (étend auth.users — voir CDC 4.1)
-- ============================================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null unique,     -- prénom/pseudo, identifiant de connexion affiché
  phone text,
  phone_visible boolean not null default true,
  email_visible boolean not null default true,
  location text,
  location_visible boolean not null default true,
  bio text,
  avatar_url text,
  joined_year int,
  has_key boolean not null default false,
  has_exit_key boolean not null default false,
  status text not null default 'pending' check (status in ('pending','active')),
  is_admin boolean not null default false,
  is_super_admin boolean not null default false, -- un seul membre — voir CDC section 3 et 6.1 ; ne se modifie jamais depuis l'app, uniquement en SQL direct
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_authenticated"
  on profiles for select
  to authenticated
  using (true); -- confidentialité : tout est visible entre membres connectés (CDC section 3)

create policy "profiles_insert_own"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Empêche un membre normal de s'auto-attribuer admin/super-admin/clé/statut via une
-- simple requête UPDATE sur sa propre ligne (autorisée ci-dessus pour le reste du profil).
-- Les vraies élévations de droits passent par les routes serveur (service_role),
-- qui contournent RLS et ce trigger n'a d'effet que pour les requêtes authentifiées "normales".
create or replace function prevent_privileged_self_update()
returns trigger as $$
begin
  if auth.role() <> 'service_role' then
    if new.is_admin is distinct from old.is_admin
       or new.is_super_admin is distinct from old.is_super_admin
       or new.has_key is distinct from old.has_key
       or new.has_exit_key is distinct from old.has_exit_key
       or new.status is distinct from old.status then
      raise exception 'Modification de champ réservé aux administrateurs (via service_role uniquement)';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_prevent_privileged_self_update
  before update on profiles
  for each row execute function prevent_privileged_self_update();

-- ============================================================================
-- PROFILE_COMMUNITIES (appartenance d'un membre à une ou plusieurs communautés)
-- ============================================================================
create table profile_communities (
  profile_id uuid not null references profiles(id) on delete cascade,
  community_id uuid not null references communities(id) on delete cascade,
  primary key (profile_id, community_id)
);

alter table profile_communities enable row level security;

create policy "profile_communities_select_authenticated"
  on profile_communities for select
  to authenticated
  using (true);

create policy "profile_communities_manage_own"
  on profile_communities for all
  to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- ============================================================================
-- EVENTS (évènements officiels, parties spontanées, disponibilités — CDC 4.2 et 12.12)
-- ============================================================================
create table events (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('officiel','spontane','dispo')),
  title text,
  description text,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  repeats_weekly boolean not null default false,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

alter table events enable row level security;

create policy "events_select_authenticated"
  on events for select
  to authenticated
  using (true);

-- Un membre normal ne peut créer que des parties spontanées / dispos à son nom ;
-- un évènement "officiel" nécessite is_admin (CDC 4.2 : "créé uniquement par un admin").
create policy "events_insert_own_or_admin"
  on events for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      type <> 'officiel'
      or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
    )
  );

create policy "events_update_own_or_admin"
  on events for update
  to authenticated
  using (
    created_by = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "events_delete_own_or_admin"
  on events for delete
  to authenticated
  using (
    created_by = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ============================================================================
-- EVENT_COMMUNITIES (étiquettes de jeu portées par un évènement)
-- ============================================================================
create table event_communities (
  event_id uuid not null references events(id) on delete cascade,
  community_id uuid not null references communities(id) on delete cascade,
  primary key (event_id, community_id)
);

alter table event_communities enable row level security;

create policy "event_communities_select_authenticated"
  on event_communities for select
  to authenticated
  using (true);

create policy "event_communities_manage_own_or_admin"
  on event_communities for all
  to authenticated
  using (
    exists (
      select 1 from events e
      where e.id = event_id
        and (e.created_by = auth.uid()
             or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin))
    )
  )
  with check (
    exists (
      select 1 from events e
      where e.id = event_id
        and (e.created_by = auth.uid()
             or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin))
    )
  );

-- ============================================================================
-- EVENT_PARTICIPANTS (inscriptions + résultats V/E/D — CDC 12.4)
-- ============================================================================
create table event_participants (
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  result text check (result in ('victoire','egalite','defaite')),
  joined_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);

alter table event_participants enable row level security;

create policy "event_participants_select_authenticated"
  on event_participants for select
  to authenticated
  using (true);

-- Rejoindre soi-même un évènement, ou y ajouter quelqu'un d'autre si on est le
-- créateur de l'évènement ou administrateur (CDC : notification "ajouté par un autre membre").
create policy "event_participants_insert"
  on event_participants for insert
  to authenticated
  with check (
    profile_id = auth.uid()
    or exists (select 1 from events e where e.id = event_id and e.created_by = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Renseigner son propre résultat V/E/D, ou celui de quelqu'un d'autre si admin (12.4).
create policy "event_participants_update"
  on event_participants for update
  to authenticated
  using (
    profile_id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "event_participants_delete"
  on event_participants for delete
  to authenticated
  using (
    profile_id = auth.uid()
    or exists (select 1 from events e where e.id = event_id and e.created_by = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ============================================================================
-- CLUB_SETTINGS (ligne unique : code immeuble, nombre de clés — CDC 12.9)
-- ============================================================================
create table club_settings (
  id smallint primary key default 1 check (id = 1),
  building_code text,
  total_keys int not null default 16,
  total_exit_keys int not null default 2
);

alter table club_settings enable row level security;

create policy "club_settings_select_authenticated"
  on club_settings for select
  to authenticated
  using (true);

insert into club_settings (id, building_code, total_keys, total_exit_keys)
values (1, null, 16, 2);

-- ============================================================================
-- ANNOUNCEMENTS + POLLS (annonces et sondages — CDC 12.5/12.6)
-- ============================================================================
create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  target_community_id uuid references communities(id), -- null = "Tous"
  announcement_date date not null default current_date,
  banner boolean not null default false,
  banner_text text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table announcements enable row level security;

-- Le filtrage "annonce Tous + celles de mes communautés" (CDC 12.5) est fait côté
-- application (l'API sait quelles communautés l'utilisateur a rejointes) ; RLS ici
-- garantit juste qu'il faut être connecté pour lire quoi que ce soit.
create policy "announcements_select_authenticated"
  on announcements for select
  to authenticated
  using (true);

create table polls (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references announcements(id) on delete cascade,
  question text not null,
  type text not null check (type in ('unique','multiple','rating'))
);

alter table polls enable row level security;

create policy "polls_select_authenticated"
  on polls for select
  to authenticated
  using (true);

create table poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  label text not null
);

alter table poll_options enable row level security;

create policy "poll_options_select_authenticated"
  on poll_options for select
  to authenticated
  using (true);

create table poll_votes (
  poll_id uuid not null references polls(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  option_id uuid references poll_options(id),
  rating smallint check (rating between 1 and 5),
  voted_at timestamptz not null default now(),
  primary key (poll_id, profile_id, option_id)
);

alter table poll_votes enable row level security;

create policy "poll_votes_select_authenticated"
  on poll_votes for select
  to authenticated
  using (true);

create policy "poll_votes_manage_own"
  on poll_votes for all
  to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- ============================================================================
-- NOTIFICATIONS (CDC 12.5)
-- ============================================================================
create table notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "notifications_select_own"
  on notifications for select
  to authenticated
  using (profile_id = auth.uid());

create policy "notifications_update_own"
  on notifications for update
  to authenticated
  using (profile_id = auth.uid());

create policy "notifications_delete_own"
  on notifications for delete
  to authenticated
  using (profile_id = auth.uid());

-- Les notifications sont créées par la logique serveur (service_role), pas par les
-- clients eux-mêmes — pas de policy INSERT pour authenticated.
