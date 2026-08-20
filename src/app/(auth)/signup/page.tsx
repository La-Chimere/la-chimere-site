import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SignupWizard } from "@/components/signup/SignupWizard";

export default async function SignupPage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const [{ data: communitiesData }, { data: memberships }] = await Promise.all([
    supabase.from("communities").select("id, label").eq("hidden", false).order("label"),
    admin.from("profile_communities").select("community_id"),
  ]);

  const counts = new Map<string, number>();
  for (const m of memberships ?? []) {
    counts.set(m.community_id, (counts.get(m.community_id) ?? 0) + 1);
  }

  const communities = (communitiesData ?? []).map((c) => ({
    id: c.id,
    label: c.label,
    count: counts.get(c.id) ?? 0,
  }));

  return <SignupWizard communities={communities} />;
}
