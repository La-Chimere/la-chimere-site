"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");
  return { supabase, userId: user.id, admin: createAdminClient() };
}

async function notifyAdmins(admin: ReturnType<typeof createAdminClient>, message: string, exceptProfileId?: string) {
  let query = admin.from("profiles").select("id").eq("is_admin", true);
  if (exceptProfileId) query = query.neq("id", exceptProfileId);
  const { data: admins } = await query;
  if (!admins || admins.length === 0) return;
  await admin.from("notifications").insert(
    admins.map((a) => ({ profile_id: a.id, type: "key", message })),
  );
}

// Un membre porteur de clé la transfère à un autre membre (CDC 14.3).
export async function transferKey(toProfileId: string) {
  const { userId, admin } = await requireUser();

  const { data: me } = await admin.from("profiles").select("has_key, display_name").eq("id", userId).single();
  if (!me?.has_key) return { error: "Tu ne possèdes pas de clé à transmettre." };

  const { data: recipient } = await admin.from("profiles").select("display_name").eq("id", toProfileId).single();
  if (!recipient) return { error: "Membre introuvable." };

  await admin.from("profiles").update({ has_key: false }).eq("id", userId);
  await admin.from("profiles").update({ has_key: true }).eq("id", toProfileId);

  await admin.from("notifications").insert({
    profile_id: toProfileId,
    type: "key",
    message: `${me.display_name} t'a transmis sa clé du local.`,
  });
  await notifyAdmins(admin, `${me.display_name} a transmis sa clé à ${recipient.display_name}.`);

  revalidatePath("/keys");
  return { error: null };
}

export async function reportLostKey() {
  const { userId, admin } = await requireUser();
  const { data: me } = await admin.from("profiles").select("display_name").eq("id", userId).single();
  await admin.from("profiles").update({ has_key: false }).eq("id", userId);
  await notifyAdmins(admin, `${me?.display_name ?? "Un membre"} a perdu sa clé du local.`);
  revalidatePath("/keys");
}

export async function borrowExitKey() {
  const { userId, admin } = await requireUser();

  const [{ data: settings }, { count }] = await Promise.all([
    admin.from("club_settings").select("total_exit_keys").eq("id", 1).single(),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("has_exit_key", true),
  ]);
  if ((count ?? 0) >= (settings?.total_exit_keys ?? 0)) {
    return { error: "Toutes les clés de sortie sont déjà empruntées." };
  }

  const { data: me } = await admin.from("profiles").select("display_name").eq("id", userId).single();
  await admin.from("profiles").update({ has_exit_key: true }).eq("id", userId);
  await notifyAdmins(admin, `${me?.display_name ?? "Un membre"} a emprunté les clés pour sortir.`);
  await admin.from("notifications").insert({
    profile_id: userId,
    type: "key",
    message: "N'oublie pas de rapporter les clés de sortie avant ta prochaine sortie du local.",
  });

  revalidatePath("/keys");
  return { error: null };
}
