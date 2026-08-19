import { createClient } from "@/lib/supabase/server";
import { AvatarCircle } from "@/components/ui/AvatarCircle";

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

  if (!profile) {
    return (
      <div className="page">
        <div className="subpage-back-row">
          <a href="/programme" className="subpage-back">
            ‹ Retour
          </a>
        </div>
        <p className="empty-hint">Membre introuvable.</p>
      </div>
    );
  }

  const contactLines = [
    profile.phone_visible && profile.phone ? `Téléphone : ${profile.phone}` : null,
    profile.location_visible && profile.location ? `Localisation : ${profile.location}` : null,
  ].filter(Boolean);

  return (
    <div className="page">
      <div className="subpage-back-row">
        <a href="/programme" className="subpage-back">
          ‹ Retour
        </a>
      </div>
      <div className="member-profile-head">
        <AvatarCircle name={profile.display_name} photoUrl={profile.avatar_url} size="lg" />
        <div className="member-profile-name">
          {profile.display_name}
          {profile.has_key ? " 🔑" : ""}
        </div>
        {profile.joined_year && (
          <div className="member-profile-joined">Au club depuis {profile.joined_year}</div>
        )}
      </div>

      {profile.bio && <p className="field-note">{profile.bio}</p>}

      <div className="section-card">
        <div className="section-subtitle">Contact</div>
        {contactLines.length > 0 ? (
          contactLines.map((line) => <p key={line} className="field-note">{line}</p>)
        ) : (
          <p className="field-note">
            Ce membre n&apos;a pas indiqué ses coordonnées. Postez un message sur le groupe
            WhatsApp pour le retrouver !
          </p>
        )}
      </div>
    </div>
  );
}
