"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Chip } from "@/components/ui/Chip";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import {
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
  type AnnouncementInput,
} from "@/lib/announcements-actions";
import { isoDate } from "@/lib/dates";
import type { CommunityOption } from "@/lib/events-types";
import type { Announcement, PollType } from "@/lib/announcements-types";

interface AnnouncementFormProps {
  open: boolean;
  onClose: () => void;
  communities: CommunityOption[];
  editing: Announcement | null;
}

const POLL_TYPE_LABELS: Record<PollType, string> = {
  unique: "Réponse unique",
  multiple: "Réponse multiple",
  rating: "Évaluation",
};

export function AnnouncementForm({ open, onClose, communities, editing }: AnnouncementFormProps) {
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [targetCommunityId, setTargetCommunityId] = useState<string | null>(
    editing?.targetCommunityId ?? null,
  );
  const [date, setDate] = useState(editing?.announcementDate ?? isoDate(new Date()));
  const [banner, setBanner] = useState(editing?.banner ?? false);
  const [bannerText, setBannerText] = useState(editing?.bannerText ?? "");
  const [pollOpen, setPollOpen] = useState(!!editing?.poll);
  const [pollQuestion, setPollQuestion] = useState(editing?.poll?.question ?? "");
  const [pollType, setPollType] = useState<PollType>(editing?.poll?.type ?? "unique");
  const [pollOptions, setPollOptions] = useState<string[]>(
    editing?.poll && editing.poll.type !== "rating"
      ? editing.poll.options.map((o) => o.label)
      : ["", ""],
  );
  const [error, setError] = useState<string | null>(null);

  const pollValid =
    !pollOpen ||
    (pollType === "rating"
      ? pollQuestion.trim().length > 0
      : pollQuestion.trim().length > 0 && pollOptions.filter((o) => o.trim()).length >= 2);

  const valid =
    title.trim() &&
    description.trim() &&
    date &&
    (!banner || bannerText.trim()) &&
    pollValid;

  function submit() {
    const input: AnnouncementInput = {
      title: title.trim(),
      description: description.trim(),
      targetCommunityId,
      announcementDate: date,
      banner,
      bannerText: bannerText.trim(),
      poll: pollOpen
        ? {
            question: pollQuestion.trim(),
            type: pollType,
            options: pollOptions.map((o) => o.trim()).filter(Boolean),
          }
        : null,
    };

    startTransition(async () => {
      const result = editing
        ? await updateAnnouncement(editing.id, input)
        : await createAnnouncement(input);
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  function remove() {
    if (!editing) return;
    startTransition(async () => {
      await deleteAnnouncement(editing.id);
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="af-header">
        <div className="af-header-label">{editing ? "Modifier l'annonce" : "Nouvelle annonce"}</div>
      </div>

      <div className="form-field">
        <label className="form-label">
          Titre <span className="required-star">*</span>
        </label>
        <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="form-field">
        <label className="form-label">Pour</label>
        <div className="filters h-scroll">
          <Chip active={!targetCommunityId} onClick={() => setTargetCommunityId(null)}>
            Tous
          </Chip>
          {communities.map((c) => (
            <Chip
              key={c.id}
              active={targetCommunityId === c.id}
              onClick={() => setTargetCommunityId(c.id)}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">
          Description <span className="required-star">*</span>
        </label>
        <textarea
          className="form-input form-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="form-field">
        <label className="form-label">
          Date <span className="required-star">*</span>
        </label>
        <input
          type="date"
          className="form-input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="form-field af-switch-row">
        <label className="form-label" style={{ marginBottom: 0 }}>
          Afficher dans le bandeau d&apos;alerte ?
        </label>
        <ToggleSwitch on={banner} onChange={setBanner} />
      </div>

      {banner && (
        <div className="form-field">
          <label className="form-label">
            Texte du bandeau <span className="required-star">*</span>
          </label>
          <textarea
            className="form-input form-textarea"
            value={bannerText}
            onChange={(e) => setBannerText(e.target.value)}
          />
        </div>
      )}

      {!pollOpen ? (
        <button type="button" className="af-add-option" onClick={() => setPollOpen(true)}>
          + Créer un sondage
        </button>
      ) : (
        <div className="form-field">
          <label className="form-label">Question du sondage</label>
          <textarea
            id="afPollQuestion"
            className="form-input form-textarea"
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
          />
          <select
            className="form-input af-poll-type-select"
            value={pollType}
            onChange={(e) => setPollType(e.target.value as PollType)}
          >
            {Object.entries(POLL_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {pollType !== "rating" &&
            pollOptions.map((opt, i) => (
              <div className="af-poll-opt-row" key={i}>
                <input
                  className="form-input"
                  value={opt}
                  onChange={(e) =>
                    setPollOptions((prev) => prev.map((o, j) => (j === i ? e.target.value : o)))
                  }
                  placeholder={`Option ${i + 1}`}
                />
                <button
                  type="button"
                  onClick={() => setPollOptions((prev) => prev.filter((_, j) => j !== i))}
                  disabled={pollOptions.length <= 2}
                >
                  ×
                </button>
              </div>
            ))}
          {pollType !== "rating" && pollOptions.length < 5 && (
            <button
              type="button"
              className="af-add-option"
              onClick={() => setPollOptions((prev) => [...prev, ""])}
            >
              + Ajouter une option
            </button>
          )}
        </div>
      )}

      {error && <p className="field-error">{error}</p>}

      <div className="modal-btn-row">
        <button
          type="button"
          className="modal-btn danger"
          onClick={editing ? remove : onClose}
          disabled={pending}
        >
          {editing ? "Supprimer" : "Annuler"}
        </button>
        <button type="button" className="modal-btn primary" onClick={submit} disabled={!valid || pending}>
          Publier
        </button>
      </div>
    </Modal>
  );
}
