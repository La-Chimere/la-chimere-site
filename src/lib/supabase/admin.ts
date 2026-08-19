import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client Supabase "service_role" — contourne totalement RLS. Ne doit être
// utilisé QUE dans des Route Handlers/Server Actions qui vérifient eux-mêmes
// les droits de l'appelant avant d'agir (voir CDC 6.1 : la clé service_role
// n'est jamais exposée côté client). `server-only` fait échouer le build si
// ce fichier est importé par erreur depuis un composant client.
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY manquant");
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
