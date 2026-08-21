import { createClient } from "@/lib/supabase/server";
import { AvatarCircle } from "@/components/ui/AvatarCircle";
import { serverT, getLocale } from "@/lib/i18n/server";
import { BackButton } from "@/components/ui/BackButton";
import { isoDate, shortDayLabel, formatHour } from "@/lib/dates";

function oneOrFirst<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

// Fiche membre en lecture seule (CDC 12.11).
export default async function MemberProfilePage(props: PageProps<"/members/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();
  const locale = await getLocale();
  const today = isoDate(new Date());

  const [{ data: profile }, { data: communitiesData }, { data: participationsData }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "display_name, avatar_url, has_key, bio, joined_year, phone, phone_visible, email, email_visible, location, location_visible",
      )
      .eq("id", id)
      .single(),
    supabase.from("profile_communities").select("communities(id, label)").eq("profile_id", id),
    supabase
      .from("event_participants")
      .select("events(id, type, title, event_date, start_time, event_communities(communities(label)))")
      .eq("profile_id", id),
  ]);

  if (!profile) {
    return (
      <div className="page">
        <div className="subpage-back-row">
          <BackButton />
        </div>
        <p className="empty-hint">{await serverT("member.notFound")}</p>
      </div>
    );
  }

  const [
    phoneLabel,
    emailLabel,
    locationLabel,
    joinedSince,
    contactTitle,
    noContact,
    keyHolderLabel,
    communitiesTitle,
    activitiesTitle,
    defaultTitle,
  ] = await Promise.all([
    serverT("member.phone"),
    serverT("member.email"),
    serverT("member.location"),
    serverT("member.joinedSince", { year: profile.joined_year ?? "" }),
    serverT("member.contact"),
    serverT("member.noContact"),
    serverT("communities.keyHolder"),
    serverT("communities.title"),
    serverT("member.activitiesTitle"),
    serverT("event.defaultTitle"),
  ]);

  const contactLines = [
    profile.email_visible && profile.email ? { label: emailLabel, value: profile.email } : null,
    profile.phone_visible && profile.phone ? { label: phoneLabel, value: profile.phone } : null,
    profile.location_visible && profile.location ? { label: locationLabel, value: profile.location } : null,
  ].filter((line): line is { label: string; value: string } => !!line);

  const communities = (communitiesData ?? [])
    .map((c) => oneOrFirst(c.communities))
    .filter((c): c is NonNullable<typeof c> => !!c)
    .sort((a, b) => a.label.localeCompare(b.label));

  const recentActivities = (participationsData ?? [])
    .map((p) => oneOrFirst(p.events))
    .filter((e): e is NonNullable<typeof e> => !!e && e.type !== "dispo" && e.event_date <= today)
    .map((e) => {
      const communityLabels = (e.event_communities ?? [])
        .map((ec) => oneOrFirst(ec.communities))
        .filter((c): c is NonNullable<typeof c> => !!c)
        .map((c) => c.label);
      return {
        id: e.id,
        title: e.title || communityLabels.join(", ") || defaultTitle,
        eventDate: e.event_date,
        startTime: e.start_time,
      };
    })
    .sort((a, b) => (a.eventDate === b.eventDate ? b.startTime.localeCompare(a.startTime) : b.eventDate.localeCompare(a.eventDate)))
    .slice(0, 10);

  return (
    <div className="page">
      <div className="subpage-back-row">
        <BackButton />
      </div>
      <div className="member-profile-head">
        <AvatarCircle name={profile.display_name} photoUrl={profile.avatar_url} size="lg" />
        <div className="member-profile-name">
          {profile.display_name}
          {profile.has_key && (
            <span className="member-key" title={keyHolderLabel}>
              🔑
            </span>
          )}
        </div>
        {profile.joined_year && <div className="member-profile-joined">{joinedSince}</div>}
      </div>

      {profile.bio && (
        <div className="section-card">
          <p className="info-box-text">{profile.bio}</p>
        </div>
      )}

      {communities.length > 0 && (
        <>
          <h1 className="page-title">{communitiesTitle}</h1>
          <div className="section-card">
            <div className="member-communities">
              {communities.map((c) => (
                <span className="tag genre" key={c.id}>
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {recentActivities.length > 0 && (
        <>
          <h1 className="page-title">{activitiesTitle}</h1>
          <div className="section-card">
            {recentActivities.map((a) => (
              <div className="commu-event-row" key={a.id}>
                <span className="commu-event-day">
                  {shortDayLabel(new Date(a.eventDate), locale)} {formatHour(a.startTime)}
                </span>
                <span className="commu-event-title">{a.title}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <h1 className="page-title">{contactTitle}</h1>
      <div className="section-card">
        {contactLines.length > 0 ? (
          contactLines.map((line) => (
            <div className="admin-row" key={line.label}>
              <span className="name">{line.label}</span>
              <span className="field-note" style={{ margin: 0 }}>
                {line.value}
              </span>
            </div>
          ))
        ) : (
          <p className="field-note">{noContact}</p>
        )}
      </div>
    </div>
  );
}
