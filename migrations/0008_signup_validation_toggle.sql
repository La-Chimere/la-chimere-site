-- Rend la validation admin des nouvelles inscriptions optionnelle (retour
-- utilisateur : la validation obligatoire n'était pas souhaitée telle
-- quelle). Désactivée par défaut : les nouveaux comptes sont actifs
-- immédiatement, sauf si un admin active ce réglage sur la page Admin.
-- Activer/désactiver le réglage n'affecte jamais les comptes déjà créés.
alter table club_settings
  add column require_signup_validation boolean not null default false;

alter table profiles
  alter column status set default 'active';
