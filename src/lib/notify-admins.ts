import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

// Notifie tous les admins d'un évènement (clé perdue, transfert, nouvelle
// inscription à valider, etc.). `exceptProfileId` évite de notifier l'admin
// qui est lui-même à l'origine de l'action.
export async function notifyAdmins(
  admin: ReturnType<typeof createAdminClient>,
  message: string,
  type: string,
  exceptProfileId?: string,
) {
  let query = admin.from("profiles").select("id").eq("is_admin", true);
  if (exceptProfileId) query = query.neq("id", exceptProfileId);
  const { data: admins } = await query;
  if (!admins || admins.length === 0) return;
  await admin.from("notifications").insert(admins.map((a) => ({ profile_id: a.id, type, message })));
}
