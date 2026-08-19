-- La Chimère — suivi "vu / pas vu" par membre pour les annonces
-- Référence : CDC 12.5. Le schéma initial n'a pas de table de suivi par
-- membre pour les annonces (contrairement aux notifications, qui ont déjà
-- une colonne "read" par ligne, chaque ligne étant déjà propre à un membre).

create table announcement_reads (
  profile_id uuid not null references profiles(id) on delete cascade,
  announcement_id uuid not null references announcements(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (profile_id, announcement_id)
);

alter table announcement_reads enable row level security;

create policy "announcement_reads_select_own"
  on announcement_reads for select
  to authenticated
  using (profile_id = auth.uid());

create policy "announcement_reads_manage_own"
  on announcement_reads for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
