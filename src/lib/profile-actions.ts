"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginEmailFromSlug } from "@/lib/slug";
import { serverT } from "@/lib/i18n/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");
  return { supabase, userId: user.id };
}

export interface ProfileInput {
  displayName: string;
  email: string;
  emailVisible: boolean;
  phone: string;
  phoneVisible: boolean;
  location: string;
  locationVisible: boolean;
  bio: string;
  avatarUrl: string | null;
  communityIds: string[];
}

export async function updateProfile(input: ProfileInput) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName,
      email: input.email || null,
      email_visible: input.emailVisible,
      phone: input.phone || null,
      phone_visible: input.phoneVisible,
      location: input.location || null,
      location_visible: input.locationVisible,
      bio: input.bio || null,
      avatar_url: input.avatarUrl,
    })
    .eq("id", userId);

  if (error) return { error: error.message };

  const { data: current } = await supabase
    .from("profile_communities")
    .select("community_id")
    .eq("profile_id", userId);
  const currentIds = new Set((current ?? []).map((c) => c.community_id));
  const nextIds = new Set(input.communityIds);

  const toAdd = input.communityIds.filter((id) => !currentIds.has(id));
  const toRemove = [...currentIds].filter((id) => !nextIds.has(id));

  if (toAdd.length > 0) {
    await supabase
      .from("profile_communities")
      .insert(toAdd.map((community_id) => ({ profile_id: userId, community_id })));
  }
  if (toRemove.length > 0) {
    await supabase
      .from("profile_communities")
      .delete()
      .eq("profile_id", userId)
      .in("community_id", toRemove);
  }

  revalidatePath("/profile");
  return { error: null };
}

// Rejoindre une communauté depuis la page Communautés, sans avoir besoin
// d'avoir participé à un évènement de cette communauté (CDC 12.8).
export async function joinCommunity(communityId: string) {
  const { supabase, userId } = await requireUser();
  await supabase.from("profile_communities").insert({ profile_id: userId, community_id: communityId });
  revalidatePath("/communities");
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const { supabase, userId } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("login_slug")
    .eq("id", userId)
    .single();
  if (!profile?.login_slug) return { error: await serverT("profile.error.cannotVerifyPassword") };

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: loginEmailFromSlug(profile.login_slug),
    password: currentPassword,
  });
  if (verifyError) return { error: await serverT("profile.error.wrongCurrentPassword") };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };

  return { error: null };
}

// Fixe l'avatar de son propre profil (utilisé juste après l'inscription,
// une fois le compte réellement créé — l'upload ne peut pas se faire avant,
// cf. CDC 13.3, l'étape 2 du parcours n'a pas encore d'utilisateur Auth).
export async function setOwnAvatarUrl(avatarUrl: string) {
  const { supabase, userId } = await requireUser();
  await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", userId);
}

export async function updateNotificationPrefs(prefs: Record<string, boolean>) {
  const { supabase, userId } = await requireUser();
  await supabase.from("profiles").update({ notification_prefs: prefs }).eq("id", userId);
  revalidatePath("/settings");
}

// Suppression de son propre compte (CDC 14.4) — action en libre-service, pas
// besoin d'être admin, uniquement de se supprimer soi-même.
export async function deleteOwnAccount() {
  const { userId } = await requireUser();
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(userId);
  redirect("/login");
}
