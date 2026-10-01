"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resizeImageFile } from "@/lib/image-resize";
import { setMatchProofPath } from "@/lib/league-actions";
import { useT } from "@/components/i18n/LocaleProvider";

interface MatchProofUploadProps {
  matchId: string;
  proofUrl: string | null;
}

// Upload de la capture d'écran de l'appli Warhammer 40,000 (score qui fait
// foi) — bucket Storage privé, RLS limitée aux deux joueurs du match et à
// l'organisateur (migration 0014). L'upload direct côté client suit le même
// schéma que AvatarUpload.tsx ; seule l'URL signée affichée ensuite diffère
// (bucket non public).
export function MatchProofUpload({ matchId, proofUrl }: MatchProofUploadProps) {
  const { t } = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(proofUrl);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      setError(t("league.matchResult.proofInvalidType"));
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const resized = await resizeImageFile(file, { maxDimension: 1280, quality: 0.8, filename: "proof.jpg" });
      const supabase = createClient();
      const path = `${matchId}/proof.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("league-match-proofs")
        .upload(path, resized, { upsert: true, cacheControl: "3600", contentType: "image/jpeg" });
      if (uploadError) {
        setError(uploadError.message);
        return;
      }
      const { data: signed } = await supabase.storage
        .from("league-match-proofs")
        .createSignedUrl(path, 3600);
      if (signed?.signedUrl) setPreview(signed.signedUrl);
      await setMatchProofPath(matchId, path);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="form-field">
      <label className="form-label">{t("league.matchResult.proofLabel")}</label>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          style={{ width: "100%", borderRadius: "var(--radius-sm)", marginBottom: 8, display: "block" }}
        />
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button type="button" className="af-add-option" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading
          ? t("profile.avatar.uploading")
          : preview
            ? t("league.matchResult.replaceProof")
            : t("league.matchResult.addProof")}
      </button>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
