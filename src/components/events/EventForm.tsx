"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { MemberPicker, type PickableMember } from "@/components/ui/MemberPicker";
import { createEvent } from "@/lib/events-actions";
import { isoDate } from "@/lib/dates";
import type { CommunityOption } from "@/lib/events-types";

interface EventFormProps {
  open: boolean;
  onClose: () => void;
  communities: CommunityOption[];
  members: PickableMember[];
  currentUser: PickableMember;
  defaultDate: Date;
}

// Formulaire de création d'une partie spontanée (CDC 4.2/12.3) — le plus
// simple possible : date + heure, étiquettes, titre (facultatif si une
// étiquette est choisie), participants, description facultative.
export function EventForm({ open, onClose, communities, members, currentUser, defaultDate }: EventFormProps) {
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState(isoDate(defaultDate));
  const [time, setTime] = useState("19:00");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [participants, setParticipants] = useState<PickableMember[]>([currentUser]);
  const [error, setError] = useState<string | null>(null);

  function toggleTag(id: string) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  const hasTag = tagIds.length > 0;
  const valid = date && time && (title.trim() || hasTag) && participants.length >= 1;

  function reset() {
    setDate(isoDate(defaultDate));
    setTime("19:00");
    setTagIds([]);
    setTitle("");
    setDescription("");
    setParticipants([currentUser]);
    setError(null);
  }

  function submit() {
    startTransition(async () => {
      const result = await createEvent({
        date,
        startTime: time,
        title: title.trim(),
        description: description.trim(),
        communityIds: tagIds,
        participantIds: participants.filter((p) => p.id !== currentUser.id).map((p) => p.id),
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      reset();
      onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <h3>Nouvelle partie</h3>
      <div className="form-row-2">
        <div className="form-field">
          <label className="form-label" htmlFor="ev-date">
            Date <span className="required-star">*</span>
          </label>
          <input
            id="ev-date"
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="ev-time">
            Heure <span className="required-star">*</span>
          </label>
          <input
            id="ev-time"
            type="time"
            className="form-input"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Étiquette</label>
        <div className="filters h-scroll">
          {communities.map((c) => (
            <Chip key={c.id} active={tagIds.includes(c.id)} onClick={() => toggleTag(c.id)}>
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="ev-title">
          Titre {!hasTag && <span className="required-star">*</span>}
        </label>
        <input
          id="ev-title"
          className="form-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={hasTag ? communities.filter((c) => tagIds.includes(c.id)).map((c) => c.label).join(", ") : "Titre de la partie"}
        />
      </div>

      <div className="form-field">
        <label className="form-label">
          Participants <span className="required-star">*</span>
        </label>
        <MemberPicker
          members={members}
          selected={participants}
          onChange={setParticipants}
          disallowRemovingLast
        />
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="ev-desc">
          Description
        </label>
        <textarea
          id="ev-desc"
          className="form-input form-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {error && <p className="field-error">{error}</p>}

      <Button variant="primary" full onClick={submit} disabled={!valid || pending}>
        {pending ? "Création…" : "Créer"}
      </Button>
    </Modal>
  );
}
