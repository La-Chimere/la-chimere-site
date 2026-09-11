import { createClient } from "@/lib/supabase/server";
import { SignupWizard } from "@/components/signup/SignupWizard";

export default async function SignupPage() {
  const supabase = await createClient();
  const [{ data: communitiesData }, { data: memberships }] = await Promise.all([
    supabase.from("communities").select("id, label").eq("hidden", false).order("label"),
    supabase.rpc("get_community_member_counts"),
  ]);

  const counts = new Map<string, number>();
  for (const m of memberships ?? []) {
    counts.set(m.community_id, m.member_count);
  }

  const communities = (communitiesData ?? []).map((c) => ({
    id: c.id,
    label: c.label,
    count: counts.get(c.id) ?? 0,
  }));

  return <SignupWizard communities={communities} />;
}
