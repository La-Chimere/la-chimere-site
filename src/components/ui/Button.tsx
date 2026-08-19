import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "danger" | "outline" | "gray";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
}

// Unifie les familles .modal-btn (maquette-principale.html) et .btn
// (maquette-creation-compte.html) : un seul composant Bouton pour toute
// l'app, cf. CDC 12.1 — style primaire/danger/outline/gray jamais redéfini
// au cas par cas.
export function Button({
  variant = "primary",
  full = false,
  className = "",
  ...props
}: ButtonProps) {
  const classes = ["modal-btn", variant, full ? "modal-btn-full" : "", className]
    .filter(Boolean)
    .join(" ");
  return <button className={classes} {...props} />;
}
