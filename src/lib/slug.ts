// Slugifie un pseudo pour construire l'email technique de connexion
// "<slug>@chimere.internal" (voir CDC 4.1 : connexion par prénom/pseudo,
// pas d'email obligatoire — Supabase Auth n'accepte qu'un identifiant de
// type email/téléphone, donc on en fabrique un jamais affiché ni envoyé).
const COMBINING_DIACRITICS = /[̀-ͯ]/g;

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function loginEmailFromSlug(slug: string): string {
  return `${slug}@chimere.internal`;
}
