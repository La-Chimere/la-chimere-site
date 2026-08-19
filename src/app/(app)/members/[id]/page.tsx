import { createClient } from "@/lib/supabase/server";
import { AvatarCircle } from "@/components/ui/AvatarCircle";
import { serverT } from "@/lib/i18n/server";

// Fiche membre en lecture seule (CDC 12.11) — version simple pour cette
// session ; "Dernière activité" et la section Communautés détaillée
// suivront avec la page Communautés.
export default async function MemberProfilePage(props: PageProps<"/members/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, avatar_url, has_key, bio, joined_year, phone, phone_visible, email_visible, location, location_visible",
    )
    .eq("id", id)
    .single();

  const back = await serverT("common.back");

  if (!profile) {
    return (
      <div className="page">
        <div className="subpage-back-row">
          <a href="/programme" className="subpage-back">
            ‹ {back}
          </a>
        </div>
        <p className="empty-hint">{await serverT("member.notFound")}</p>
      </div>
    );
  }

  const [phoneLabel, locationLabel, joinedSince, contactTitle, noContact] = await Promise.all([
    serverT("member.phone"),
    serverT("member.location"),
    serverT("member.joinedSince", { year: profile.joined_year ?? "" }),
    serverT("member.contact"),
    serverT("member.noContact"),
  ]);

  const contactLines = [
    profile.phone_visible && profile.phone ? `${phoneLabel} : ${profile.phone}` : null,
    profile.location_visible && profile.location ? `${locationLabel} : ${profile.location}` : null,
  ].filter(Boolean);

  return (
    <div className="page">
      <div className="subpage-back-row">
        <a href="/programme" className="subpage-back">
          ‹ {back}
        </a>
      </div>
      <div className="member-profile-head">
        <AvatarCircle name={profile.display_name} photoUrl={profile.avatar_url} size="lg" />
        <div className="member-profile-name">
          {profile.display_name}
          {profile.has_key ? " 🔑" : ""}
        </div>
        {profile.joined_year && <div className="member-profile-joined">{joinedSince}</div>}
      </div>

      {profile.bio && <p className="field-note">{profile.bio}</p>}

      <div className="section-card">
        <div className="section-subtitle">{contactTitle}</div>
        {contactLines.length > 0 ? (
          contactLines.map((line) => <p key={line} className="field-note">{line}</p>)
        ) : (
          <p className="field-note">{noContact}</p>
        )}
      </div>
    </div>
  );
}
