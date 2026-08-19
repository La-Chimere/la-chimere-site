import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/programme");

  return (
    <div className="page">
      <h1 className="page-title">Admin</h1>
      <p className="empty-hint">
        Cette page (Clés / Membres / Communautés) arrive dans une prochaine session (CDC 12.9).
      </p>
    </div>
  );
}
