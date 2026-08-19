"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginEmailFromSlug, slugify } from "@/lib/slug";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export interface AuthActionState {
  error?: string;
}

// Connexion par pseudo (CDC 4.1) : Supabase Auth n'acceptant qu'un email, on
// résout le pseudo -> login_slug -> email synthétique via le client
// service_role (la RLS de profiles interdit la lecture avant connexion),
// puis on se connecte réellement avec le client de session normal.
export async function login(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!displayName || !password) {
    return { error: "Pseudo et mot de passe requis." };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("login_slug")
    .ilike("display_name", displayName)
    .maybeSingle();

  if (!profile?.login_slug) {
    return { error: "Identifiants incorrects." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: loginEmailFromSlug(profile.login_slug),
    password,
  });

  if (error) {
    return { error: "Identifiants incorrects." };
  }

  redirect("/programme");
}

// Inscription (CDC 4.1/13) : version simple pour cette première itération —
// le parcours complet en 3 étapes (13.2-13.5) suivra. Crée le compte Auth
// (email synthétique) + la ligne profiles en statut "pending" (validation
// admin requise, cf. CDC 3).
export async function signup(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!displayName || !password) {
    return { error: "Pseudo et mot de passe requis." };
  }
  if (password !== passwordConfirm) {
    return { error: "Les mots de passe ne correspondent pas." };
  }

  const admin = createAdminClient();
  const baseSlug = slugify(displayName);
  if (!baseSlug) {
    return { error: "Pseudo invalide." };
  }

  let finalSlug = baseSlug;
  let userId: string | null = null;

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}${attempt + 1}`;
    const { data, error } = await admin.auth.admin.createUser({
      email: loginEmailFromSlug(candidate),
      password,
      email_confirm: true,
    });
    if (!error && data.user) {
      finalSlug = candidate;
      userId = data.user.id;
      break;
    }
    if (error && !error.message.toLowerCase().includes("already")) {
      return { error: "Impossible de créer le compte : " + error.message };
    }
  }

  if (!userId) {
    return { error: "Impossible de créer le compte, réessaie." };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    display_name: displayName,
    login_slug: finalSlug,
    status: "pending",
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return { error: "Impossible de créer le profil : " + profileError.message };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: loginEmailFromSlug(finalSlug),
    password,
  });

  if (signInError) {
    redirect("/login");
  }

  redirect("/programme");
}
