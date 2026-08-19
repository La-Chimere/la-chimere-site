import { createClient } from "@/lib/supabase/server";
import { SignupWizard } from "@/components/signup/SignupWizard";

export default async function SignupPage() {
  const supabase = await createClient();
  const { data: communitiesData } = await supabase
    .from("communities")
    .select("id, label")
    .eq("hidden", false)
    .order("label");

  return <SignupWizard communities={communitiesData ?? []} />;
}
