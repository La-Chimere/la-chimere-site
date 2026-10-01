"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { createLeague, type CreateLeagueInput } from "@/lib/league-actions";
import { useT } from "@/components/i18n/LocaleProvider";

interface LeagueCreateFormProps {
  communityId: string;
  communityLabel: string;
}

const FORMATS: CreateLeagueInput["format"][] = ["poule", "libre"];
const FORMAT_KEYS: Record<CreateLeagueInput["format"], string> = {
  poule: "league.format.poule",
  libre: "league.format.libre",
};

export function LeagueCreateForm({ communityId, communityLabel }: LeagueCreateFormProps) {
  const { t } = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CreateLeagueInput["format"]>("poule");
  const [pointsWin, setPointsWin] = useState(3);
  const [pointsTie, setPointsTie] = useState(1);
  const [pointsLoss, setPointsLoss] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length > 0;

  function submit() {
    startTransition(async () => {
      const result = await createLeague({
        communityId,
        name: name.trim(),
        format,
        pointsWin,
        pointsTie,
        pointsLoss,
      });
      if (result.error || !result.id) {
        setError(result.error);
        return;
      }
      router.push(`/communities/${communityId}/leagues/${result.id}/admin`);
    });
  }

  return (
    <div className="page">
      <div className="subpage-back-row">
        <BackButton />
      </div>

      <h1 className="page-title">{t("league.create.title", { community: communityLabel })}</h1>

      <div className="section-card">
        <div className="form-field">
          <label className="form-label">
            {t("league.create.nameLabel")} <span className="required-star">*</span>
          </label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("league.create.namePlaceholder")}
          />
        </div>

        <div className="form-field">
          <label className="form-label">{t("league.create.formatLabel")}</label>
          <div className="filters">
            {FORMATS.map((f) => (
              <Chip key={f} active={format === f} onClick={() => setFormat(f)}>
                {t(FORMAT_KEYS[f])}
              </Chip>
            ))}
          </div>
          <p className="field-note" style={{ marginTop: 8 }}>
            {t(`league.format.${format}.description` as const)}
          </p>
        </div>

        <div className="form-field">
          <label className="form-label">{t("league.create.pointsLabel")}</label>
          <div className="form-row-2">
            <div className="form-field">
              <label className="form-label">{t("league.admin.pointsWin")}</label>
              <input
                type="number"
                className="form-input"
                value={pointsWin}
                onChange={(e) => setPointsWin(Number(e.target.value))}
              />
            </div>
            <div className="form-field">
              <label className="form-label">{t("league.admin.pointsTie")}</label>
              <input
                type="number"
                className="form-input"
                value={pointsTie}
                onChange={(e) => setPointsTie(Number(e.target.value))}
              />
            </div>
            <div className="form-field">
              <label className="form-label">{t("league.admin.pointsLoss")}</label>
              <input
                type="number"
                className="form-input"
                value={pointsLoss}
                onChange={(e) => setPointsLoss(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {error && <p className="field-error">{error}</p>}

        <Button variant="primary" full disabled={!valid || pending} onClick={submit}>
          {t("league.create.submit")}
        </Button>
      </div>
    </div>
  );
}
