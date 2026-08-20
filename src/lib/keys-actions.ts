"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdmins } from "@/lib/notify-admins";
import { serverT } from "@/lib/i18n/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");
  return { supabase, userId: user.id, admin: createAdminClient() };
}

// Un membre porteur de clé la transfère à un autre membre (CDC 14.3).
export async function transferKey(toProfileId: string) {
  const { userId, admin } = await requireUser();

  const { data: me } = await admin.from("profiles").select("has_key, display_name").eq("id", userId).single();
  if (!me?.has_key) return { error: await serverT("keys.error.noKeyToGive") };

  const { data: recipient } = await admin.from("profiles").select("display_name").eq("id", toProfileId).single();
  if (!recipient) return { error: await serverT("keys.error.memberNotFound") };

  await admin.from("profiles").update({ has_key: false }).eq("id", userId);
  await admin.from("profiles").update({ has_key: true }).eq("id", toProfileId);

  await admin.from("notifications").insert({
    profile_id: toProfileId,
    type: "key",
    message: await serverT("keys.notif.receivedKey", { name: me.display_name }),
  });
  await notifyAdmins(
    admin,
    await serverT("keys.notif.transferredKey", { from: me.display_name, to: recipient.display_name }),
    "key",
  );

  revalidatePath("/keys");
  return { error: null };
}

export async function reportLostKey() {
  const { userId, admin } = await requireUser();
  const { data: me } = await admin.from("profiles").select("display_name").eq("id", userId).single();
  await admin.from("profiles").update({ has_key: false }).eq("id", userId);
  await notifyAdmins(
    admin,
    await serverT("keys.notif.lostKey", { name: me?.display_name ?? (await serverT("keys.aMember")) }),
    "key",
  );
  revalidatePath("/keys");
}

export async function borrowExitKey() {
  const { userId, admin } = await requireUser();

  const [{ data: settings }, { count }] = await Promise.all([
    admin.from("club_settings").select("total_exit_keys").eq("id", 1).single(),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("has_exit_key", true),
  ]);
  if ((count ?? 0) >= (settings?.total_exit_keys ?? 0)) {
    return { error: await serverT("keys.error.allExitKeysBorrowed") };
  }

  const { data: me } = await admin.from("profiles").select("display_name").eq("id", userId).single();
  await admin.from("profiles").update({ has_exit_key: true }).eq("id", userId);
  await notifyAdmins(
    admin,
    await serverT("keys.notif.borrowedExitKeys", { name: me?.display_name ?? (await serverT("keys.aMember")) }),
    "key",
  );
  await admin.from("notifications").insert({
    profile_id: userId,
    type: "key",
    message: await serverT("keys.notif.returnReminder"),
  });

  revalidatePath("/keys");
  return { error: null };
}
