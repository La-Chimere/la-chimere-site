"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");
  return { supabase, userId: user.id };
}

// Rejoindre un événement (CDC 12.4).
export async function joinEvent(eventId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("event_participants").insert({ event_id: eventId, profile_id: userId });
  revalidatePath("/programme");
}

// Quitter un événement — impossible si on est l'unique participant (CDC 12.4).
export async function leaveEvent(eventId: string) {
  const { supabase, userId } = await requireUserId();

  const { count } = await supabase
    .from("event_participants")
    .select("profile_id", { count: "exact", head: true })
    .eq("event_id", eventId);

  if ((count ?? 0) <= 1) return;

  await supabase
    .from("event_participants")
    .delete()
    .eq("event_id", eventId)
    .eq("profile_id", userId);
  revalidatePath("/programme");
}

// Résultat V/E/D d'un participant — soi-même, ou n'importe qui si admin
// (RLS s'en charge ; ici on ne fait qu'appeler l'update, cf. CDC 12.4).
export async function setEventResult(
  eventId: string,
  profileId: string,
  result: "victoire" | "egalite" | "defaite" | null,
) {
  const { supabase } = await requireUserId();
  await supabase
    .from("event_participants")
    .update({ result })
    .eq("event_id", eventId)
    .eq("profile_id", profileId);
  revalidatePath("/programme");
}

export async function deleteEvent(eventId: string) {
  const { supabase } = await requireUserId();
  await supabase.from("events").delete().eq("id", eventId);
  revalidatePath("/programme");
}

export interface CreateEventInput {
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  title: string;
  description: string;
  communityIds: string[];
  participantIds: string[];
}

// Création d'une partie spontanée (CDC 4.2/12.3). Les événements "officiels"
// sont réservés aux admins et seront ajoutés avec la page Admin.
export async function createEvent(input: CreateEventInput) {
  const { supabase, userId } = await requireUserId();

  const [h, m] = input.startTime.split(":").map(Number);
  const endHour = Math.min(h + 2, 23);
  const endTime = `${String(endHour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      type: "spontane",
      title: input.title || null,
      description: input.description || null,
      event_date: input.date,
      start_time: input.startTime,
      end_time: endTime,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !event) {
    return { error: error?.message ?? "Impossible de créer l'événement." };
  }

  if (input.communityIds.length > 0) {
    await supabase.from("event_communities").insert(
      input.communityIds.map((community_id) => ({ event_id: event.id, community_id })),
    );
  }

  const participantIds = new Set([userId, ...input.participantIds]);
  await supabase.from("event_participants").insert(
    Array.from(participantIds).map((profile_id) => ({ event_id: event.id, profile_id })),
  );

  revalidatePath("/programme");
  return { error: null };
}
