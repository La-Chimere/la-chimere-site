"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireSuperAdmin } from "@/lib/admin-guard";
import { slugify } from "@/lib/slug";
import { serverT } from "@/lib/i18n/server";

export async function validateMember(profileId: string) {
  const { admin } = await requireAdmin();
  await admin.from("profiles").update({ status: "active" }).eq("id", profileId);
  revalidatePath("/admin");
}

export async function deleteMember(profileId: string) {
  const { admin } = await requireAdmin();
  await admin.auth.admin.deleteUser(profileId);
  revalidatePath("/admin");
}

export async function updateBuildingCode(code: string) {
  const { admin } = await requireAdmin();
  await admin.from("club_settings").update({ building_code: code }).eq("id", 1);
  revalidatePath("/admin");
  revalidatePath("/keys");
}

export async function updateKeyTotal(field: "total_keys" | "total_exit_keys", value: number) {
  const { admin } = await requireAdmin();

  const holderField = field === "total_keys" ? "has_key" : "has_exit_key";
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq(holderField, true);

  if (value < (count ?? 0)) {
    return { error: await serverT("admin.error.totalBelowHolders") };
  }

  await admin.from("club_settings").update({ [field]: value }).eq("id", 1);
  revalidatePath("/admin");
  return { error: null };
}

export async function setKeyHolder(profileId: string, hasKey: boolean) {
  const { admin } = await requireAdmin();

  if (hasKey) {
    const [{ data: settings }, { count }] = await Promise.all([
      admin.from("club_settings").select("total_keys").eq("id", 1).single(),
      admin.from("profiles").select("id", { count: "exact", head: true }).eq("has_key", true),
    ]);
    if ((count ?? 0) >= (settings?.total_keys ?? 0)) {
      return { error: await serverT("admin.error.maxKeysReached") };
    }
  }

  await admin.from("profiles").update({ has_key: hasKey }).eq("id", profileId);
  revalidatePath("/admin");
  revalidatePath("/keys");
  return { error: null };
}

export async function setExitKeyHolder(profileId: string, hasExitKey: boolean) {
  const { admin } = await requireAdmin();
  await admin.from("profiles").update({ has_exit_key: hasExitKey }).eq("id", profileId);
  revalidatePath("/admin");
  revalidatePath("/keys");
}

export async function addCommunity(label: string) {
  const { admin } = await requireAdmin();

  const baseKey = slugify(label);
  let finalKey = baseKey;
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = attempt === 0 ? baseKey : `${baseKey}${attempt + 1}`;
    const { data: existing } = await admin
      .from("communities")
      .select("id")
      .eq("key", candidate)
      .maybeSingle();
    if (!existing) {
      finalKey = candidate;
      break;
    }
  }

  const { error } = await admin.from("communities").insert({ key: finalKey, label });
  revalidatePath("/admin");
  return { error: error?.message ?? null };
}

export async function updateCommunityLabel(id: string, label: string) {
  const { admin } = await requireAdmin();
  await admin.from("communities").update({ label }).eq("id", id);
  revalidatePath("/admin");
}

export async function setCommunityHidden(id: string, hidden: boolean) {
  const { admin } = await requireAdmin();
  await admin.from("communities").update({ hidden }).eq("id", id);
  revalidatePath("/admin");
}

export async function setCommunityCompetitive(id: string, competitive: boolean) {
  const { admin } = await requireAdmin();
  await admin.from("communities").update({ competitive }).eq("id", id);
  revalidatePath("/admin");
}

export async function resetMemberPassword(profileId: string, newPassword: string) {
  const { admin } = await requireAdmin();
  const { error } = await admin.auth.admin.updateUserById(profileId, { password: newPassword });
  return { error: error?.message ?? null };
}

// Grant/revoke le rôle admin — réservé au super-administrateur (CDC 14.4).
export async function setAdminRole(profileId: string, isAdmin: boolean) {
  const { admin } = await requireSuperAdmin();
  await admin.from("profiles").update({ is_admin: isAdmin }).eq("id", profileId);
  revalidatePath("/admin");
  revalidatePath("/settings");
}
