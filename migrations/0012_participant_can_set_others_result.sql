-- Un participant d'un évènement peut désormais renseigner le résultat V/E/D
-- de n'importe quel autre participant du MÊME évènement (pas seulement le
-- sien) — décision produit : dans la pratique, une seule personne (celle
-- qui reste après la partie) saisit souvent les résultats de tout le monde.
-- Toujours limité aux membres qui participent réellement à cet évènement
-- (ou aux admins, comme avant).
drop policy if exists "event_participants_update" on event_participants;
create policy "event_participants_update"
  on event_participants for update
  to authenticated
  using (
    exists (
      select 1 from event_participants ep
      where ep.event_id = event_participants.event_id and ep.profile_id = auth.uid()
    )
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );
