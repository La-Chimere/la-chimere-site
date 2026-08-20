"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface KeyAlertClickResult {
  count: number;
  sent: boolean;
}

// Incrémente le compteur d'envois pour ce jour, plafonné à 2/jour au total
// (RPC atomique, voir migration 0009) — évite de spammer le groupe WhatsApp.
export async function sendKeyAlertClick(eventDate: string): Promise<KeyAlertClickResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const { data, error } = await supabase
    .rpc("increment_key_alert", { p_event_date: eventDate })
    .single<{ new_count: number; incremented: boolean }>();

  if (error || !data) return { count: 0, sent: false };

  revalidatePath("/programme");
  return { count: data.new_count, sent: data.incremented };
}
