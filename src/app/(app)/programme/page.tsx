import { createClient } from "@/lib/supabase/server";
import { daysOfWeek, isoDate, monthGridDays } from "@/lib/dates";
import { ProgrammeClient } from "@/components/events/ProgrammeClient";
import type { CommunityOption, EventItem } from "@/lib/events-types";

// Sans types générés depuis le schéma Supabase, le client ne connait pas la
// cardinalité réelle d'une relation "vers le parent" (FK) et l'infère comme
// un tableau ; côté Postgres/PostgREST c'est bien un objet unique à
// l'exécution. Ce petit helper normalise les deux cas.
function oneOrFirst<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default async function ProgrammePage(props: PageProps<"/programme">) {
  const searchParams = await props.searchParams;
  const weekParam = typeof searchParams.week === "string" ? searchParams.week : null;
  const reference = weekParam ? new Date(weekParam) : new Date();
  const week = daysOfWeek(reference);
  // Sert à la fois la liste (semaine) et le calendrier mensuel : la grille du
  // mois est un sur-ensemble qui couvre toujours la semaine affichée.
  const grid = monthGridDays(reference);
  const rangeStart = isoDate(grid[0]);
  const rangeEnd = isoDate(grid[grid.length - 1]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // le layout parent redirige déjà vers /login
  }

  const [{ data: profile }, { data: communitiesData }, { data: eventsData }, { data: membersData }] =
    await Promise.all([
      supabase.from("profiles").select("display_name, is_admin").eq("id", user.id).single(),
      supabase
        .from("communities")
        .select("id, key, label, competitive")
        .eq("hidden", false)
        .order("label"),
      supabase
        .from("events")
        .select(
          `id, type, title, description, event_date, start_time, end_time, created_by,
          event_communities(communities(id, key, label, competitive)),
          event_participants(profile_id, result, profiles(display_name, has_key))`,
        )
        .gte("event_date", rangeStart)
        .lte("event_date", rangeEnd)
        .order("start_time"),
      supabase.from("profiles").select("id, display_name").order("display_name"),
    ]);

  const communities: CommunityOption[] = (communitiesData ?? []).map((c) => ({
    id: c.id,
    key: c.key,
    label: c.label,
    competitive: c.competitive,
  }));

  const events: EventItem[] = (eventsData ?? []).map((e) => ({
    id: e.id,
    type: e.type as EventItem["type"],
    title: e.title,
    description: e.description,
    eventDate: e.event_date,
    startTime: e.start_time,
    endTime: e.end_time,
    createdBy: e.created_by,
    communities: (e.event_communities ?? [])
      .map((ec) => oneOrFirst(ec.communities))
      .filter((c): c is NonNullable<typeof c> => !!c)
      .map((c) => ({ id: c.id, key: c.key, label: c.label, competitive: c.competitive })),
    participants: (e.event_participants ?? [])
      .map((p) => ({ ...p, profiles: oneOrFirst(p.profiles) }))
      .filter((p) => p.profiles)
      .map((p) => ({
        profileId: p.profile_id,
        displayName: p.profiles!.display_name,
        hasKey: p.profiles!.has_key,
        result: p.result as EventItem["participants"][number]["result"],
      })),
  }));

  const members = (membersData ?? []).map((m) => ({ id: m.id, displayName: m.display_name }));
  const currentUser = { id: user.id, displayName: profile?.display_name ?? "Moi" };

  return (
    <ProgrammeClient
      reference={isoDate(reference)}
      days={week.map(isoDate)}
      events={events}
      communities={communities}
      members={members}
      currentUser={currentUser}
      isAdmin={profile?.is_admin ?? false}
    />
  );
}
