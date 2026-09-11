const COMBINING_DIACRITICS = /[̀-ͯ]/g;

// Normalise pour une recherche insensible à la casse et aux accents
// (ex. taper "jeremy" doit trouver "Jérémy").
export function normalizeForSearch(value: string): string {
  return value.normalize("NFD").replace(COMBINING_DIACRITICS, "").toLowerCase();
}

// Échappe les caractères spéciaux de motif LIKE/ILIKE (%, _, \) avant de les
// passer tels quels dans .ilike() côté Supabase — sans ça, une saisie
// utilisateur comme "ali%" ou "a_ic_" agit comme un joker et peut faire
// correspondre le compte d'un autre membre (ex. lors de la connexion par
// pseudo, ou d'une vérification d'unicité).
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
