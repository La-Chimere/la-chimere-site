interface AvatarCircleProps {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "header" | "lg";
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || "?";
}

const SIZE_CLASS: Record<NonNullable<AvatarCircleProps["size"]>, string> = {
  sm: "avatar",
  header: "avatar-btn",
  lg: "member-profile-avatar",
};

// Initiales sur fond couleur d'accent tant qu'aucune photo n'est ajoutée ;
// dès qu'une photo existe, elle remplace les initiales (CDC 12.2/13.4).
export function AvatarCircle({ name, photoUrl, size = "sm", className = "" }: AvatarCircleProps) {
  const classes = [SIZE_CLASS[size], className].filter(Boolean).join(" ");
  const style = photoUrl
    ? { backgroundImage: `url(${photoUrl})`, color: "transparent" }
    : undefined;

  return (
    <div className={classes} style={style} aria-label={name}>
      {!photoUrl && initials(name)}
    </div>
  );
}
