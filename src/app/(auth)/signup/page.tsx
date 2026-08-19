"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthActionState } from "@/lib/auth-actions";
import { Button } from "@/components/ui/Button";

const initialState: AuthActionState = {};

// Version simple pour cette première itération (pseudo + mot de passe) — le
// parcours complet en 3 étapes (CDC 13.2-13.5 : communautés, avatar, bio,
// règlement/CGU) sera construit dans une prochaine session.
export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <form action={formAction} style={{ textAlign: "left" }}>
      <h1 style={{ fontSize: 21, fontWeight: 800, marginBottom: 20, textAlign: "center" }}>
        Rejoindre le Club
      </h1>
      <div className="form-field">
        <label className="form-label" htmlFor="displayName">
          Prénom ou pseudo
        </label>
        <input
          id="displayName"
          name="displayName"
          className="form-input"
          placeholder="Ex : Louis-Marie"
          required
        />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="form-input"
          autoComplete="new-password"
          required
        />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="passwordConfirm">
          Confirmer le mot de passe
        </label>
        <input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          className="form-input"
          autoComplete="new-password"
          required
        />
      </div>
      {state.error && <p className="field-error">{state.error}</p>}
      <Button variant="primary" full type="submit" disabled={pending}>
        {pending ? "Création…" : "Rejoindre"}
      </Button>
      <p className="field-note" style={{ textAlign: "center", marginTop: 14 }}>
        Déjà un compte ? <Link href="/login">Se connecter</Link>
      </p>
    </form>
  );
}
