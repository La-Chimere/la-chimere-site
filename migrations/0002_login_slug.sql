-- La Chimère — ajout du slug de connexion
-- Référence : CDC section 4.1 (connexion par prénom/pseudo, pas d'email obligatoire).
-- Supabase Auth n'accepte qu'un email ou un téléphone comme identifiant ; on génère
-- donc un email technique synthétique "<login_slug>@chimere.internal" dérivé du
-- pseudo, jamais affiché ni utilisé pour un vrai envoi de mail. Ce slug est unique
-- et sert uniquement à retrouver l'utilisateur Auth correspondant à un pseudo saisi.

alter table profiles add column login_slug text unique;

comment on column profiles.login_slug is
  'Slug technique dérivé du pseudo, utilisé pour construire l''email synthétique de connexion (<login_slug>@chimere.internal). Jamais affiché aux membres.';
