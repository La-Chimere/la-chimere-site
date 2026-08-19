-- La Chimère — lecture publique des communautés visibles (pour l'étape 2 du
-- parcours d'inscription, avant que le compte existe donc avant toute
-- session authentifiée). Ne montre jamais les communautés masquées.
create policy "communities_select_anon"
  on communities for select
  to anon
  using (hidden = false);
