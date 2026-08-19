"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeSignup } from "@/lib/auth-actions";
import { Button } from "@/components/ui/Button";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

interface SignupWizardProps {
  communities: { id: string; label: string }[];
}

const TOTAL_STEPS = 3;
const YEARS = Array.from({ length: 12 }, (_, i) => 2026 - i);

export function SignupWizard({ communities }: SignupWizardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2 | 3 | "success">(1);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [emailVisible, setEmailVisible] = useState(true);
  const [phone, setPhone] = useState("");
  const [phoneVisible, setPhoneVisible] = useState(true);
  const [location, setLocation] = useState("");
  const [locationVisible, setLocationVisible] = useState(true);
  const [consent1, setConsent1] = useState(false);

  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [joinedYear, setJoinedYear] = useState<number>(2026);
  const [bio, setBio] = useState("");

  const [consent2, setConsent2] = useState(false);

  const step1Valid =
    displayName.trim() &&
    password &&
    passwordConfirm === password &&
    consent1;
  const step3Valid = consent2;

  function toggleCommunity(id: string) {
    setSelectedCommunities((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await completeSignup({
        displayName: displayName.trim(),
        password,
        email,
        emailVisible,
        phone,
        phoneVisible,
        location,
        locationVisible,
        joinedYear,
        bio,
        communityIds: selectedCommunities,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setStep("success");
    });
  }

  if (step === "success") {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 18 }}>✅</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Bienvenue au Club !</h1>
        <Button variant="primary" full onClick={() => router.push("/programme")}>
          Accéder à l&apos;app
        </Button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "left" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div className="af-header-label">Étape {step} / {TOTAL_STEPS}</div>
        <div
          style={{
            height: 4,
            borderRadius: 99,
            background: "var(--surface-2)",
            marginTop: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(step / TOTAL_STEPS) * 100}%`,
              background: "var(--accent)",
              transition: "width .28s ease",
            }}
          />
        </div>
      </div>

      {step === 1 && (
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 16 }}>Qui es-tu ?</h2>
          <div className="form-field">
            <label className="form-label">
              Prénom ou pseudo <span className="required-star">*</span>
            </label>
            <input
              className="form-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex : Louis-Marie"
            />
          </div>
          <div className="form-field">
            <div className="field-head">
              <label className="form-label">Mail</label>
              <div className="visibility-switch">
                <span className="txt">Visible</span>
                <ToggleSwitch on={emailVisible} onChange={setEmailVisible} />
              </div>
            </div>
            <input className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-field">
            <div className="field-head">
              <label className="form-label">Téléphone</label>
              <div className="visibility-switch">
                <span className="txt">Visible</span>
                <ToggleSwitch on={phoneVisible} onChange={setPhoneVisible} />
              </div>
            </div>
            <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="form-field">
            <div className="field-head">
              <label className="form-label">Localisation</label>
              <div className="visibility-switch">
                <span className="txt">Visible</span>
                <ToggleSwitch on={locationVisible} onChange={setLocationVisible} />
              </div>
            </div>
            <input
              className="form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex : Plainpalais à 15 min du local"
            />
            <p className="field-note">
              Ces informations restent visibles uniquement par toi et l&apos;administrateur
              technique, sauf si tu choisis de les partager (voir étape 3 pour la gestion de tes
              données).
            </p>
          </div>
          <div className="form-field">
            <label className="form-label">
              Mot de passe <span className="required-star">*</span>
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label className="form-label">
              Confirmer le mot de passe <span className="required-star">*</span>
            </label>
            <input
              type="password"
              className="form-input"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
            {passwordConfirm && passwordConfirm !== password && (
              <p className="field-error">Les mots de passe ne correspondent pas.</p>
            )}
          </div>
          <div className="consent-row" style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12, marginBottom: 15 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13.5, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={consent1}
                onChange={(e) => setConsent1(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span>
                L&apos;appartenance au Club La Chimère inclut <strong>une participation
                financière mensuelle</strong> et d&apos;avoir <strong>rencontré au moins un des
                membres du comité</strong>. Je confirme en avoir connaissance et m&apos;en être
                acquitté.
              </span>
            </label>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>Bienvenue ! À quoi tu joues ?</h2>
          <p className="field-note" style={{ marginBottom: 14 }}>
            Sélectionne tes communautés ! Tu pourras modifier ça quand tu veux.
          </p>
          {communities.map((c) => (
            <label
              key={c.id}
              className="commu-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 4px",
                borderBottom: "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={selectedCommunities.includes(c.id)}
                onChange={() => toggleCommunity(c.id)}
              />
              <span style={{ fontWeight: 600, fontSize: 14.5 }}>{c.label}</span>
            </label>
          ))}

          <div className="form-field" style={{ marginTop: 18 }}>
            <label className="form-label">T&apos;es depuis combien de temps au club ?</label>
            <select
              className="form-input"
              value={joinedYear}
              onChange={(e) => setJoinedYear(Number(e.target.value))}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Tu veux te présenter ?</label>
            <textarea
              className="form-input form-textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Dire quel jeu tu préfères ? Quelle armée tu joues ? Éclate-toi !"
            />
            <p className="field-note">
              Tu pourras ajouter une photo de profil juste après, depuis Mon profil.
            </p>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 16 }}>Bon à savoir</h2>
          <div className="info-box">
            <div className="info-box-title">📋 Règlement du club</div>
            <p className="info-box-text info-box-placeholder">
              Le texte complet du règlement sera ajouté avant la mise en production.
            </p>
          </div>
          <div className="info-box">
            <div className="info-box-title">📄 Conditions générales d&apos;utilisation</div>
            <p className="info-box-text info-box-placeholder">
              Le texte complet des CGU sera ajouté avant la mise en production.
            </p>
          </div>
          <div className="consent-row" style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13.5, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={consent2}
                onChange={(e) => setConsent2(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span>J&apos;atteste avoir lu et accepté le règlement du club et les conditions générales d&apos;utilisation.</span>
            </label>
          </div>
        </div>
      )}

      {error && <p className="field-error">{error}</p>}

      <div className="modal-btn-row">
        <button
          type="button"
          className="modal-btn gray"
          onClick={() => (step === 1 ? router.push("/login") : setStep((s) => (s as number) - 1 as 1 | 2 | 3))}
        >
          Retour
        </button>
        {step < 3 ? (
          <button
            type="button"
            className="modal-btn primary"
            disabled={step === 1 && !step1Valid}
            onClick={() => setStep((s) => (s as number) + 1 as 1 | 2 | 3)}
          >
            Suivant
          </button>
        ) : (
          <button
            type="button"
            className="modal-btn primary"
            disabled={!step3Valid || pending}
            onClick={submit}
          >
            {pending ? "Création…" : "Rejoindre"}
          </button>
        )}
      </div>
    </div>
  );
}
