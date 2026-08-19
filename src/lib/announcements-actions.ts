"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-guard";
import type { createAdminClient } from "@/lib/supabase/admin";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");
  return { supabase, userId: user.id };
}

export interface AnnouncementInput {
  title: string;
  description: string;
  targetCommunityId: string | null;
  announcementDate: string;
  banner: boolean;
  bannerText: string;
  poll: {
    question: string;
    type: "unique" | "multiple" | "rating";
    options: string[];
  } | null;
}

async function replacePoll(admin: ReturnType<typeof createAdminClient>, announcementId: string, poll: AnnouncementInput["poll"]) {
  // Remplace systématiquement le sondage existant (les votes n'existent pas
  // encore tant que le formulaire est en cours d'édition côté admin ; en
  // édition réelle avec des votes déjà enregistrés, un admin qui modifie les
  // options d'un sondage assume la perte des votes déjà donnés).
  const { data: existingPoll } = await admin
    .from("polls")
    .select("id")
    .eq("announcement_id", announcementId)
    .maybeSingle();
  if (existingPoll) {
    await admin.from("polls").delete().eq("id", existingPoll.id);
  }
  if (!poll) return;

  const { data: newPoll, error } = await admin
    .from("polls")
    .insert({ announcement_id: announcementId, question: poll.question, type: poll.type })
    .select("id")
    .single();
  if (error || !newPoll) return;

  if (poll.type !== "rating" && poll.options.length > 0) {
    await admin
      .from("poll_options")
      .insert(poll.options.map((label) => ({ poll_id: newPoll.id, label })));
  }
}

export async function createAnnouncement(input: AnnouncementInput) {
  const { admin, userId } = await requireAdmin();

  const { data: announcement, error } = await admin
    .from("announcements")
    .insert({
      title: input.title,
      description: input.description,
      target_community_id: input.targetCommunityId,
      announcement_date: input.announcementDate,
      banner: input.banner,
      banner_text: input.banner ? input.bannerText : null,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !announcement) {
    return { error: error?.message ?? "Impossible de créer l'annonce." };
  }

  if (input.banner) {
    await admin.from("announcements").update({ banner: false }).neq("id", announcement.id);
    await admin.from("announcements").update({ banner: true }).eq("id", announcement.id);
  }

  await replacePoll(admin, announcement.id, input.poll);

  revalidatePath("/announcements");
  return { error: null };
}

export async function updateAnnouncement(id: string, input: AnnouncementInput) {
  const { admin } = await requireAdmin();

  const { error } = await admin
    .from("announcements")
    .update({
      title: input.title,
      description: input.description,
      target_community_id: input.targetCommunityId,
      announcement_date: input.announcementDate,
      banner: input.banner,
      banner_text: input.banner ? input.bannerText : null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  if (input.banner) {
    await admin.from("announcements").update({ banner: false }).neq("id", id);
    await admin.from("announcements").update({ banner: true }).eq("id", id);
  }

  await replacePoll(admin, id, input.poll);

  revalidatePath("/announcements");
  return { error: null };
}

export async function deleteAnnouncement(id: string) {
  const { admin } = await requireAdmin();
  await admin.from("announcements").delete().eq("id", id);
  revalidatePath("/announcements");
}

export async function toggleAnnouncementSeen(announcementId: string, seen: boolean) {
  const { supabase, userId } = await requireUser();
  if (seen) {
    await supabase
      .from("announcement_reads")
      .upsert({ profile_id: userId, announcement_id: announcementId });
  } else {
    await supabase
      .from("announcement_reads")
      .delete()
      .eq("profile_id", userId)
      .eq("announcement_id", announcementId);
  }
  revalidatePath("/announcements");
}

export async function markAllAnnouncementsSeen(announcementIds: string[]) {
  const { supabase, userId } = await requireUser();
  if (announcementIds.length === 0) return;
  await supabase
    .from("announcement_reads")
    .upsert(announcementIds.map((announcement_id) => ({ profile_id: userId, announcement_id })));
  revalidatePath("/announcements");
}

export interface VoteInput {
  optionIds?: string[];
  rating?: number;
}

export async function voteOnPoll(pollId: string, input: VoteInput) {
  const { supabase, userId } = await requireUser();

  await supabase.from("poll_votes").delete().eq("poll_id", pollId).eq("profile_id", userId);

  if (input.rating) {
    await supabase.from("poll_votes").insert({ poll_id: pollId, profile_id: userId, rating: input.rating });
  } else if (input.optionIds && input.optionIds.length > 0) {
    await supabase.from("poll_votes").insert(
      input.optionIds.map((option_id) => ({ poll_id: pollId, profile_id: userId, option_id })),
    );
  }

  revalidatePath("/announcements");
}

export async function markNotificationRead(id: string, read: boolean) {
  const { supabase } = await requireUser();
  await supabase.from("notifications").update({ read }).eq("id", id);
  revalidatePath("/announcements");
}

export async function deleteNotification(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("notifications").delete().eq("id", id);
  revalidatePath("/announcements");
}

export async function markAllNotificationsRead() {
  const { supabase, userId } = await requireUser();
  await supabase.from("notifications").update({ read: true }).eq("profile_id", userId);
  revalidatePath("/announcements");
}

export async function deleteAllNotifications() {
  const { supabase, userId } = await requireUser();
  await supabase.from("notifications").delete().eq("profile_id", userId);
  revalidatePath("/announcements");
}
