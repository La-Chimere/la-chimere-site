import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileClient } from "@/components/profile/ProfileClient";
import type { CommunityOption } from "@/lib/events-types";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: communitiesData }, { data: myCommunities }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "display_name, email, email_visible, phone, phone_visible, location, location_visible, bio, avatar_url",
      )
      .eq("id", user.id)
      .single(),
    supabase.from("communities").select("id, key, label, competitive").eq("hidden", false).order("label"),
    supabase.from("profile_communities").select("community_id").eq("profile_id", user.id),
  ]);

  if (!profile) redirect("/login");

  const communities: CommunityOption[] = (communitiesData ?? []).map((c) => ({
    id: c.id,
    key: c.key,
    label: c.label,
    competitive: c.competitive,
  }));

  return (
    <ProfileClient
      userId={user.id}
      profile={{
        displayName: profile.display_name,
        email: profile.email ?? "",
        emailVisible: profile.email_visible,
        phone: profile.phone ?? "",
        phoneVisible: profile.phone_visible,
        location: profile.location ?? "",
        locationVisible: profile.location_visible,
        bio: profile.bio ?? "",
        avatarUrl: profile.avatar_url,
      }}
      communities={communities}
      myCommunityIds={(myCommunities ?? []).map((c) => c.community_id)}
    />
  );
}
