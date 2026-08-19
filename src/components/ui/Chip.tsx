import { type ButtonHTMLAttributes } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  /**
   * "solid" = chip de filtre par jeu / étiquette de formulaire (fond plein
   * couleur d'accent une fois sélectionné).
   * "outline" = sélecteur de communauté (Programme, Leaderboard, Communautés,
   * Mon profil) : fond blanc, contour + texte couleur d'accent (CDC 12.1).
   */
  variant?: "solid" | "outline";
}

export function Chip({
  active = false,
  variant = "solid",
  className = "",
  ...props
}: ChipProps) {
  const classes = [
    "chip",
    variant === "outline" ? "chip-outline" : "",
    active ? "active" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <button type="button" className={classes} {...props} />;
}
