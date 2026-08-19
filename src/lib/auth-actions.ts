"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginEmailFromSlug, slugify } from "@/lib/slug";
import { serverT } from "@/lib/i18n/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export interface AuthActionState {
  error?: string | null;
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
    return { error: await serverT("auth.error.missingCredentials") };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("login_slug")
    .ilike("display_name", displayName)
    .maybeSingle();

  if (!profile?.login_slug) {
    return { error: await serverT("auth.error.invalidCredentials") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: loginEmailFromSlug(profile.login_slug),
    password,
  });

  if (error) {
    return { error: await serverT("auth.error.invalidCredentials") };
  }

  redirect("/programme");
}

export interface SignupInput {
  displayName: string;
  password: string;
  email: string;
  emailVisible: boolean;
  phone: string;
  phoneVisible: boolean;
  location: string;
  locationVisible: boolean;
  joinedYear: number | null;
  bio: string;
  communityIds: string[];
}

// Inscription complète (CDC 4.1/13.2-13.5) : crée le compte Auth (email
// synthétique) + la ligne profiles en statut "pending" (validation admin
// requise, cf. CDC 3) + les communautés choisies à l'étape 2.
export async function completeSignup(input: SignupInput): Promise<AuthActionState> {
  const displayName = input.displayName.trim();
  if (!displayName || !input.password) {
    return { error: await serverT("auth.error.missingCredentials") };
  }

  const admin = createAdminClient();
  const baseSlug = slugify(displayName);
  if (!baseSlug) {
    return { error: await serverT("auth.error.invalidNickname") };
  }

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .ilike("display_name", displayName)
    .maybeSingle();
  if (existingProfile) {
    return { error: await serverT("auth.error.nicknameTaken") };
  }

  let finalSlug = baseSlug;
  let userId: string | null = null;

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}${attempt + 1}`;
    const { data, error } = await admin.auth.admin.createUser({
      email: loginEmailFromSlug(candidate),
      password: input.password,
      email_confirm: true,
    });
    if (!error && data.user) {
      finalSlug = candidate;
      userId = data.user.id;
      break;
    }
    if (error && !error.message.toLowerCase().includes("already")) {
      return { error: (await serverT("auth.error.createAccountFailed")) + " " + error.message };
    }
  }

  if (!userId) {
    return { error: await serverT("auth.error.createAccountRetry") };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    display_name: displayName,
    login_slug: finalSlug,
    status: "pending",
    email: input.email || null,
    email_visible: input.emailVisible,
    phone: input.phone || null,
    phone_visible: input.phoneVisible,
    location: input.location || null,
    location_visible: input.locationVisible,
    joined_year: input.joinedYear,
    bio: input.bio || null,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return { error: (await serverT("auth.error.createProfileFailed")) + " " + profileError.message };
  }

  if (input.communityIds.length > 0) {
    await admin
      .from("profile_communities")
      .insert(input.communityIds.map((community_id) => ({ profile_id: userId, community_id })));
  }

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({
    email: loginEmailFromSlug(finalSlug),
    password: input.password,
  });

  return { error: null };
}
