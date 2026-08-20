"use client";

import { useState, useTransition } from "react";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { changePassword, updateProfile } from "@/lib/profile-actions";
import type { CommunityOption } from "@/lib/events-types";
import { useT } from "@/components/i18n/LocaleProvider";
import { BackArrowIcon } from "@/components/ui/icons";

interface ProfileData {
  displayName: string;
  email: string;
  emailVisible: boolean;
  phone: string;
  phoneVisible: boolean;
  location: string;
  locationVisible: boolean;
  bio: string;
  avatarUrl: string | null;
}

interface ProfileClientProps {
  userId: string;
  profile: ProfileData;
  communities: CommunityOption[];
  myCommunityIds: string[];
}

export function ProfileClient({ userId, profile, communities, myCommunityIds }: ProfileClientProps) {
  const { t } = useT();
  const [pending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [email, setEmail] = useState(profile.email);
  const [emailVisible, setEmailVisible] = useState(profile.emailVisible);
  const [phone, setPhone] = useState(profile.phone);
  const [phoneVisible, setPhoneVisible] = useState(profile.phoneVisible);
  const [location, setLocation] = useState(profile.location);
  const [locationVisible, setLocationVisible] = useState(profile.locationVisible);
  const [bio, setBio] = useState(profile.bio);
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>(myCommunityIds);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const passwordTouched = currentPassword || newPassword || confirmPassword;
  const passwordValid =
    !passwordTouched || (currentPassword && newPassword && newPassword === confirmPassword);

  function toggleCommunity(id: string) {
    setSelectedCommunities((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateProfile({
        displayName,
        email,
        emailVisible,
        phone,
        phoneVisible,
        location,
        locationVisible,
        bio,
        avatarUrl,
        communityIds: selectedCommunities,
      });
      if (result.error) {
        setError(result.error);
        return;
      }

      if (passwordTouched && passwordValid) {
        const pwResult = await changePassword(currentPassword, newPassword);
        if (pwResult.error) {
          setError(pwResult.error);
          return;
        }
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    });
  }

  return (
    <div className="page">
      <div className="subpage-back-row">
        <a href="/programme" className="subpage-back">
          <BackArrowIcon /> {t("common.back")}
        </a>
      </div>

      <div className="section-card">
        <AvatarUpload
          userId={userId}
          currentUrl={avatarUrl}
          displayName={displayName}
          onUploaded={setAvatarUrl}
        />
      </div>

      <div className="section-card">
        <div className="form-field">
          <label className="form-label">{t("signup.step1.nickname")}</label>
          <input className="form-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>

        <div className="form-field">
          <div className="field-head">
            <label className="form-label">{t("signup.step1.email")}</label>
            <div className="visibility-switch">
              <span className="txt">{t("signup.step1.visible")}</span>
              <ToggleSwitch on={emailVisible} onChange={setEmailVisible} />
            </div>
          </div>
          <input className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="form-field">
          <div className="field-head">
            <label className="form-label">{t("signup.step1.phone")}</label>
            <div className="visibility-switch">
              <span className="txt">{t("signup.step1.visible")}</span>
              <ToggleSwitch on={phoneVisible} onChange={setPhoneVisible} />
            </div>
          </div>
          <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div className="form-field">
          <div className="field-head">
            <label className="form-label">{t("signup.step1.location")}</label>
            <div className="visibility-switch">
              <span className="txt">{t("signup.step1.visible")}</span>
              <ToggleSwitch on={locationVisible} onChange={setLocationVisible} />
            </div>
          </div>
          <input className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <div className="form-field">
          <label className="form-label">{t("profile.bio")}</label>
          <textarea className="form-input form-textarea" value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
      </div>

      <h1 className="page-title">{t("profile.myCommunities")}</h1>
      <div className="section-card">
        <div className="filters h-scroll" id="profCommuFilters">
          {communities.map((c) => (
            <Chip
              key={c.id}
              variant="outline"
              active={selectedCommunities.includes(c.id)}
              onClick={() => toggleCommunity(c.id)}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      <h1 className="page-title">{t("profile.changePassword")}</h1>
      <div className="section-card">
        <div className="form-field">
          <label className="form-label">{t("profile.currentPassword")}</label>
          <input
            type="password"
            className="form-input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-label">{t("profile.newPassword")}</label>
          <input
            type="password"
            className="form-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-label">{t("profile.confirmNewPassword")}</label>
          <input
            type="password"
            className="form-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {passwordTouched && newPassword !== confirmPassword && (
            <p className="field-error">{t("signup.step1.passwordMismatch")}</p>
          )}
        </div>
      </div>

      {error && <p className="field-error">{error}</p>}

      <Button variant="primary" full onClick={save} disabled={pending || !passwordValid}>
        {saved ? t("profile.saved") : t("profile.saveChanges")}
      </Button>
    </div>
  );
}
