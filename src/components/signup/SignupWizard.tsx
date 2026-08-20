"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeSignup } from "@/lib/auth-actions";
import { setOwnAvatarUrl } from "@/lib/profile-actions";
import { createClient } from "@/lib/supabase/client";
import { resizeImageFile } from "@/lib/image-resize";
import { Button } from "@/components/ui/Button";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { useT } from "@/components/i18n/LocaleProvider";
import { CheckIcon } from "@/components/ui/icons";

interface SignupCommunity {
  id: string;
  label: string;
  count: number;
}

interface SignupWizardProps {
  communities: SignupCommunity[];
}

const TOTAL_STEPS = 3;
const YEARS = Array.from({ length: 12 }, (_, i) => 2026 - i);

export function SignupWizard({ communities }: SignupWizardProps) {
  const { t } = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2 | 3 | "success">(1);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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

  async function onPickAvatar(file: File) {
    const resized = await resizeImageFile(file);
    setAvatarFile(resized);
    setAvatarPreview(URL.createObjectURL(resized));
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
      if (avatarFile) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const path = `${user.id}/avatar.jpg`;
          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(path, avatarFile, { upsert: true, cacheControl: "3600", contentType: "image/jpeg" });
          if (!uploadError) {
            const { data } = supabase.storage.from("avatars").getPublicUrl(path);
            await setOwnAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
          }
        }
      }
      setStep("success");
    });
  }

  if (step === "success") {
    return (
      <div style={{ textAlign: "center" }}>
        <div className="success-icon">
          <CheckIcon />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>{t("signup.success.title")}</h1>
        <Button variant="primary" full onClick={() => router.push("/programme")}>
          {t("signup.success.cta")}
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        padding: "36px 30px 20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 380,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          textAlign: "left",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20, flex: "none" }}>
          <div className="af-header-label">{t("signup.step", { current: step, total: TOTAL_STEPS })}</div>
          <div
            style={{
              height: 4,
              borderRadius: 99,
              background: "var(--border)",
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

        <div className="signup-steps-scroll">
          {step === 1 && (
            <div key="step1" className="signup-step-anim">
              <h2 className="step-title">{t("signup.step1.title")}</h2>
              <div className="form-field">
                <label className="form-label">
                  {t("signup.step1.nickname")} <span className="required-star">*</span>
                </label>
                <input
                  className="form-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("signup.step1.nicknamePlaceholder")}
                />
              </div>
              <div className="form-field">
                <div className="field-head">
                  <label className="form-label">{t("signup.step1.email")}</label>
                  <div className="visibility-switch">
                    <span className="txt">{t("signup.step1.visible")}</span>
                    <ToggleSwitch on={emailVisible} onChange={setEmailVisible} />
                  </div>
                </div>
                <input
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("common.optional")}
                />
              </div>
              <div className="form-field">
                <div className="field-head">
                  <label className="form-label">{t("signup.step1.phone")}</label>
                  <div className="visibility-switch">
                    <span className="txt">{t("signup.step1.visible")}</span>
                    <ToggleSwitch on={phoneVisible} onChange={setPhoneVisible} />
                  </div>
                </div>
                <input
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("common.optional")}
                />
              </div>
              <div className="form-field">
                <div className="field-head">
                  <label className="form-label">{t("signup.step1.location")}</label>
                  <div className="visibility-switch">
                    <span className="txt">{t("signup.step1.visible")}</span>
                    <ToggleSwitch on={locationVisible} onChange={setLocationVisible} />
                  </div>
                </div>
                <input
                  className="form-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t("signup.step1.locationPlaceholder")}
                />
                <p className="field-note">{t("signup.step1.locationNote")}</p>
              </div>
              <div className="form-field">
                <label className="form-label">
                  {t("signup.step1.password")} <span className="required-star">*</span>
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
                  {t("signup.step1.confirmPassword")} <span className="required-star">*</span>
                </label>
                <input
                  type="password"
                  className={`form-input ${passwordConfirm && passwordConfirm !== password ? "error" : ""}`}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                />
                {passwordConfirm && passwordConfirm !== password && (
                  <p className="field-error">{t("signup.step1.passwordMismatch")}</p>
                )}
              </div>
              <label className="consent-row">
                <input type="checkbox" checked={consent1} onChange={(e) => setConsent1(e.target.checked)} />
                {/* Contenu HTML statique du dictionnaire (pas de saisie utilisateur) : la mise en
                    gras de deux passages précis nécessite du balisage, cf. CDC 13.3. */}
                <span className="txt" dangerouslySetInnerHTML={{ __html: t("signup.step1.consent") }} />
              </label>
            </div>
          )}

          {step === 2 && (
            <div key="step2" className="signup-step-anim">
              <h2 className="step-title">{t("signup.step2.title")}</h2>
              <p className="step-subtitle">{t("signup.step2.subtitle")}</p>

              <div className="avatar-upload-wrap">
                <button
                  type="button"
                  className={`avatar-upload ${avatarPreview ? "has-photo" : ""}`}
                  style={avatarPreview ? { backgroundImage: `url(${avatarPreview})` } : undefined}
                  onClick={() => fileInputRef.current?.click()}
                  title={t("signup.step2.addPhoto")}
                >
                  {!avatarPreview && "+"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onPickAvatar(file);
                  }}
                />
                <button type="button" className="avatar-upload-label" onClick={() => fileInputRef.current?.click()}>
                  {avatarPreview ? t("signup.step2.changePhoto") : t("signup.step2.addPhoto")}
                </button>
              </div>

              {communities.map((c) => {
                const selected = selectedCommunities.includes(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    className={`commu-row ${selected ? "selected" : ""}`}
                    onClick={() => toggleCommunity(c.id)}
                  >
                    <span className="commu-check">
                      <CheckIcon />
                    </span>
                    <span className="commu-name">{c.label}</span>
                    <span className="commu-count">{t("signup.step2.memberCount", { n: c.count })}</span>
                  </button>
                );
              })}

              <div className="form-field" style={{ marginTop: 18 }}>
                <label className="form-label">{t("signup.step2.joinedYear")}</label>
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
                <label className="form-label">{t("signup.step2.bio")}</label>
                <textarea
                  className="form-input form-textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t("signup.step2.bioPlaceholder")}
                />
                <p className="field-note">{t("signup.step2.bioNote")}</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div key="step3" className="signup-step-anim">
              <h2 className="step-title">{t("signup.step3.title")}</h2>
              <p className="step-subtitle">{t("signup.step3.subtitle")}</p>
              <div className="info-box">
                <div className="info-box-title">📋 {t("signup.step3.rulesTitle")}</div>
                <p className="info-box-text info-box-placeholder">{t("signup.step3.rulesPlaceholder")}</p>
              </div>
              <div className="info-box">
                <div className="info-box-title">📄 {t("signup.step3.termsTitle")}</div>
                <p className="info-box-text info-box-placeholder">{t("signup.step3.termsPlaceholder")}</p>
              </div>
              <label className="consent-row">
                <input type="checkbox" checked={consent2} onChange={(e) => setConsent2(e.target.checked)} />
                <span className="txt">{t("signup.step3.consent")}</span>
              </label>
            </div>
          )}
        </div>

        {error && <p className="field-error">{error}</p>}

        <div className="modal-btn-row signup-footer">
          <button
            type="button"
            className="modal-btn gray"
            onClick={() => (step === 1 ? router.push("/login") : setStep((s) => (s as number) - 1 as 1 | 2 | 3))}
          >
            {t("common.back")}
          </button>
          {step < 3 ? (
            <button
              type="button"
              className="modal-btn primary"
              disabled={step === 1 && !step1Valid}
              onClick={() => setStep((s) => (s as number) + 1 as 1 | 2 | 3)}
            >
              {t("common.next")}
            </button>
          ) : (
            <button
              type="button"
              className="modal-btn primary"
              disabled={!step3Valid || pending}
              onClick={submit}
            >
              {pending ? t("signup.step3.joining") : t("signup.step3.join")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
