"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, type AuthActionState } from "@/lib/auth-actions";
import { Button } from "@/components/ui/Button";
import { LogoIcon } from "@/components/ui/icons";

const initialState: AuthActionState = {};

export default function LoginPage() {
  const [showForm, setShowForm] = useState(false);
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <>
      <div style={{ width: 96, height: 96, color: "var(--accent)", margin: "0 auto 22px" }}>
        <LogoIcon />
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 28 }}>
        Bienvenue au Club
        <br />
        La Chimère !
      </h1>

      {!showForm ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/signup" style={{ textDecoration: "none" }}>
            <Button variant="primary" full type="button">
              Créer mon compte
            </Button>
          </Link>
          <Button variant="outline" full type="button" onClick={() => setShowForm(true)}>
            Me connecter
          </Button>
        </div>
      ) : (
        <form action={formAction} style={{ textAlign: "left" }}>
          <button
            type="button"
            className="subpage-back"
            style={{ marginBottom: 16 }}
            onClick={() => setShowForm(false)}
          >
            ‹ Retour
          </button>
          <div className="form-field">
            <label className="form-label" htmlFor="displayName">
              Pseudo
            </label>
            <input
              id="displayName"
              name="displayName"
              className="form-input"
              placeholder="Ton pseudo"
              autoComplete="username"
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
              autoComplete="current-password"
              required
            />
          </div>
          {state.error && <p className="field-error">{state.error}</p>}
          <Button variant="primary" full type="submit" disabled={pending}>
            {pending ? "Connexion…" : "Se connecter"}
          </Button>
        </form>
      )}
    </>
  );
}
