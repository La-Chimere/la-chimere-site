"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { MemberPicker, type PickableMember } from "@/components/ui/MemberPicker";
import { createEvent } from "@/lib/events-actions";
import { isoDate } from "@/lib/dates";
import type { CommunityOption } from "@/lib/events-types";
import { useT } from "@/components/i18n/LocaleProvider";

interface EventFormProps {
  open: boolean;
  onClose: () => void;
  communities: CommunityOption[];
  members: PickableMember[];
  currentUser: PickableMember;
  defaultDate: Date;
  isAvailability?: boolean;
}

// Formulaire de création d'une partie spontanée, ou d'une disponibilité en
// mode isAvailability (CDC 4.2/12.3/12.12) — le plus simple possible : date +
// heure, étiquettes, titre (facultatif si une étiquette est choisie),
// participants (masqué en mode disponibilité), description facultative.
export function EventForm({
  open,
  onClose,
  communities,
  members,
  currentUser,
  defaultDate,
  isAvailability = false,
}: EventFormProps) {
  const { t } = useT();
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState(isoDate(defaultDate));
  const [time, setTime] = useState("19:00");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [participants, setParticipants] = useState<PickableMember[]>([currentUser]);
  const [repeatsWeekly, setRepeatsWeekly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTag(id: string) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  const hasTag = tagIds.length > 0;
  const valid = isAvailability
    ? date && time && (title.trim() || hasTag)
    : date && time && (title.trim() || hasTag) && participants.length >= 1;

  function reset() {
    setDate(isoDate(defaultDate));
    setTime("19:00");
    setTagIds([]);
    setTitle("");
    setDescription("");
    setParticipants([currentUser]);
    setRepeatsWeekly(false);
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
        participantIds: isAvailability
          ? []
          : participants.filter((p) => p.id !== currentUser.id).map((p) => p.id),
        isAvailability,
        repeatsWeekly,
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
      <h3>{isAvailability ? t("event.form.titleAvailability") : t("event.form.titleEvent")}</h3>
      <div className="form-row-2">
        <div className="form-field">
          <label className="form-label" htmlFor="ev-date">
            {t("event.form.date")} <span className="required-star">*</span>
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
            {t("event.form.time")} <span className="required-star">*</span>
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

      {isAvailability && (
        <label className="ce-repeat-row">
          <input
            type="checkbox"
            checked={repeatsWeekly}
            onChange={(e) => setRepeatsWeekly(e.target.checked)}
          />
          {t("event.form.repeatsWeekly")}
        </label>
      )}

      <div className="form-field">
        <label className="form-label">{t("event.form.tag")}</label>
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
          {t("event.form.title")} {!hasTag && <span className="required-star">*</span>}
        </label>
        <input
          id="ev-title"
          className="form-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={hasTag ? communities.filter((c) => tagIds.includes(c.id)).map((c) => c.label).join(", ") : t("event.form.titlePlaceholder")}
        />
      </div>

      {!isAvailability && (
        <div className="form-field">
          <label className="form-label">
            {t("event.form.participants")} <span className="required-star">*</span>
          </label>
          <MemberPicker
            members={members}
            selected={participants}
            onChange={setParticipants}
            disallowRemovingLast
          />
        </div>
      )}

      <div className="form-field">
        <label className="form-label" htmlFor="ev-desc">
          {t("event.form.description")}
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
        {pending ? t("event.form.creating") : t("common.create")}
      </Button>
    </Modal>
  );
}
