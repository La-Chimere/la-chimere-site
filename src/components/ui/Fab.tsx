import { type ButtonHTMLAttributes } from "react";

export function Fab(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className="fab" aria-label="Créer" {...props}>
      +
    </button>
  );
}
