"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface DangerConfirmButtonProps {
  onConfirm: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  confirmLabel?: string;
}

// Pattern "Sûr ?" à deux clics (CDC 12.5/14.4) : le premier clic arme la
// confirmation, un second clic dans la seconde exécute l'action ; un clic
// ailleurs sur la page annule et restaure l'état initial.
export function DangerConfirmButton({
  onConfirm,
  disabled,
  className = "",
  children,
  confirmLabel = "Sûr ?",
}: DangerConfirmButtonProps) {
  const [armed, setArmed] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!armed) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setArmed(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [armed]);

  return (
    <button
      ref={ref}
      type="button"
      className={`${className} ${armed ? "confirm" : ""}`}
      disabled={disabled}
      onClick={() => {
        if (armed) {
          onConfirm();
          setArmed(false);
        } else {
          setArmed(true);
        }
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}
