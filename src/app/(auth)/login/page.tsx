"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, type AuthActionState } from "@/lib/auth-actions";
import { Button } from "@/components/ui/Button";
import { LogoIcon } from "@/components/ui/icons";
import { useT } from "@/components/i18n/LocaleProvider";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";

const initialState: AuthActionState = {};

export default function LoginPage() {
  const { t } = useT();
  const [showForm, setShowForm] = useState(false);
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <>
      {!showForm && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <LanguageToggle />
        </div>
      )}
      <div style={{ width: 96, height: 96, color: "var(--accent)", margin: "0 auto 22px" }}>
        <LogoIcon />
      </div>
      <h1 className="landing-title">
        {t("login.welcomeLine1")}
        <br />
        {t("login.welcomeLine2")}
      </h1>

      {!showForm ? (
        <div className="landing-actions">
          <Link href="/signup" style={{ textDecoration: "none" }}>
            <Button variant="primary" full type="button">
              {t("login.createAccount")}
            </Button>
          </Link>
          <Button variant="ghost" full type="button" onClick={() => setShowForm(true)}>
            {t("login.logIn")}
          </Button>
        </div>
      ) : (
        <form action={formAction} style={{ textAlign: "left" }}>
          <button type="button" className="login-back" onClick={() => setShowForm(false)}>
            ‹ {t("common.back")}
          </button>
          <div className="form-field">
            <label className="form-label" htmlFor="displayName">
              {t("login.nickname")}
            </label>
            <input
              id="displayName"
              name="displayName"
              className="form-input"
              placeholder={t("login.nicknamePlaceholder")}
              autoComplete="username"
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="password">
              {t("login.password")}
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
            {pending ? t("login.loggingIn") : t("login.submit")}
          </Button>
        </form>
      )}
    </>
  );
}
