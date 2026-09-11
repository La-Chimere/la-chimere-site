const COMBINING_DIACRITICS = /[̀-ͯ]/g;

// Normalise pour une recherche insensible à la casse et aux accents
// (ex. taper "jeremy" doit trouver "Jérémy").
export function normalizeForSearch(value: string): string {
  return value.normalize("NFD").replace(COMBINING_DIACRITICS, "").toLowerCase();
}
