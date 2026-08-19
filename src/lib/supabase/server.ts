import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client Supabase côté serveur (Server Components, Server Actions, Route
// Handlers) : la session vient des cookies, RLS s'applique normalement avec
// les droits de l'utilisateur connecté. Ne jamais utiliser pour des actions
// admin — voir lib/supabase/admin.ts pour ça.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Appelé depuis un Server Component : sans effet, la session
            // est de toute façon rafraîchie par proxy.ts sur chaque requête.
          }
        },
      },
    },
  );
}
