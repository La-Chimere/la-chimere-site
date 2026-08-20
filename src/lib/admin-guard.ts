import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Vérifie que l'appelant est bien connecté et admin avant de rendre le
// client service_role disponible à l'action qui l'utilise (CDC 6.1 : la clé
// service_role ne doit jamais agir sans ce contrôle fait en premier).
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_super_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) throw new Error("Réservé aux administrateurs.");

  return {
    userId: user.id,
    isSuperAdmin: profile.is_super_admin,
    admin: createAdminClient(),
  };
}

// Indépendant de requireAdmin() : le super-administrateur garde ce rôle même
// quand is_admin est désactivé sur son propre compte (utile pour tester
// l'expérience "membre normal" tout en gardant la capacité de repasser admin).
export async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_super_admin) throw new Error("Réservé au super-administrateur.");

  return {
    userId: user.id,
    isSuperAdmin: true,
    admin: createAdminClient(),
  };
}
