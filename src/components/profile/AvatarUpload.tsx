"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/components/i18n/LocaleProvider";
import { resizeImageFile } from "@/lib/image-resize";

interface AvatarUploadProps {
  userId: string;
  currentUrl: string | null;
  displayName: string;
  onUploaded: (url: string) => void;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

// Sélecteur de photo de profil (CDC 13.4/14.2) : upload direct vers le
// bucket Supabase Storage "avatars" (RLS : chaque membre n'écrit que dans
// son propre dossier), puis mise à jour de profiles.avatar_url.
export function AvatarUpload({ userId, currentUrl, displayName, onUploaded }: AvatarUploadProps) {
  const { t } = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const resized = await resizeImageFile(file);
      const supabase = createClient();
      const path = `${userId}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, resized, { upsert: true, cacheControl: "3600", contentType: "image/jpeg" });
      if (uploadError) {
        setError(uploadError.message);
        return;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setPreview(url);
      onUploaded(url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="avatar-upload-wrap">
      <button
        type="button"
        className={`avatar-upload ${preview ? "has-photo" : ""}`}
        style={preview ? { backgroundImage: `url(${preview})` } : undefined}
        onClick={() => inputRef.current?.click()}
      >
        {!preview && initials(displayName)}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button type="button" className="avatar-upload-label" onClick={() => inputRef.current?.click()}>
        {uploading ? t("profile.avatar.uploading") : t("profile.avatar.change")}
      </button>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
