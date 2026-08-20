import { createClient } from "@/lib/supabase/server";
import { AvatarCircle } from "@/components/ui/AvatarCircle";
import { serverT } from "@/lib/i18n/server";
import { BackArrowIcon } from "@/components/ui/icons";

// Fiche membre en lecture seule (CDC 12.11) — version simple pour cette
// session ; "Dernière activité" et la section Communautés détaillée
// suivront avec la page Communautés.
export default async function MemberProfilePage(props: PageProps<"/members/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, avatar_url, has_key, bio, joined_year, phone, phone_visible, email, email_visible, location, location_visible",
    )
    .eq("id", id)
    .single();

  const back = await serverT("common.back");

  if (!profile) {
    return (
      <div className="page">
        <div className="subpage-back-row">
          <a href="/programme" className="subpage-back">
            <BackArrowIcon /> {back}
          </a>
        </div>
        <p className="empty-hint">{await serverT("member.notFound")}</p>
      </div>
    );
  }

  const [phoneLabel, emailLabel, locationLabel, joinedSince, contactTitle, noContact, keyHolderLabel] =
    await Promise.all([
      serverT("member.phone"),
      serverT("member.email"),
      serverT("member.location"),
      serverT("member.joinedSince", { year: profile.joined_year ?? "" }),
      serverT("member.contact"),
      serverT("member.noContact"),
      serverT("communities.keyHolder"),
    ]);

  const contactLines = [
    profile.email_visible && profile.email ? { label: emailLabel, value: profile.email } : null,
    profile.phone_visible && profile.phone ? { label: phoneLabel, value: profile.phone } : null,
    profile.location_visible && profile.location ? { label: locationLabel, value: profile.location } : null,
  ].filter((line): line is { label: string; value: string } => !!line);

  return (
    <div className="page">
      <div className="subpage-back-row">
        <a href="/programme" className="subpage-back">
          <BackArrowIcon /> {back}
        </a>
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
