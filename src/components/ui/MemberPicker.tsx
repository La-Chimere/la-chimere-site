"use client";

import { useMemo, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";

export interface PickableMember {
  id: string;
  displayName: string;
}

interface MemberPickerProps {
  members: PickableMember[];
  selected: PickableMember[];
  onChange: (members: PickableMember[]) => void;
  placeholder?: string;
  /** Un participant ne peut pas être retiré s'il est le seul restant (CDC 12.4). */
  disallowRemovingLast?: boolean;
}

// Recherche + ajout par chip, réutilisé pour les participants d'un
// événement, la recherche de porteur de clé, le transfert de clé, la
// désignation d'admin (CDC 12.3 et 12.9).
export function MemberPicker({
  members,
  selected,
  onChange,
  placeholder,
  disallowRemovingLast = false,
}: MemberPickerProps) {
  const { t } = useT();
  const resolvedPlaceholder = placeholder ?? t("memberPicker.searchPlaceholder");
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const selectedIds = new Set(selected.map((m) => m.id));
    const q = query.trim().toLowerCase();
    return members
      .filter((m) => !selectedIds.has(m.id) && m.displayName.toLowerCase().includes(q))
      .slice(0, 8);
  }, [members, selected, query]);

  function add(member: PickableMember) {
    onChange([...selected, member]);
    setQuery("");
  }

  function remove(id: string) {
    if (disallowRemovingLast && selected.length <= 1) return;
    onChange(selected.filter((m) => m.id !== id));
  }

  return (
    <div>
      {selected.length > 0 && (
        <div className="ce-participants">
          {selected.map((m) => (
            <span className="ce-chip" key={m.id}>
              {m.displayName}
              <button
                type="button"
                onClick={() => remove(m.id)}
                disabled={disallowRemovingLast && selected.length <= 1}
                aria-label={t("memberPicker.remove", { name: m.displayName })}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="ce-search-wrap">
        <span className="ce-search-icon">🔍</span>
        <input
          className="form-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={resolvedPlaceholder}
        />
        <div className={`ce-member-results ${results.length ? "open" : ""}`}>
          {results.length === 0 && query.trim() ? (
            <div className="ce-member-empty">{t("memberPicker.noResults")}</div>
          ) : (
            results.map((m) => (
              <div className="ce-member-row" key={m.id} onClick={() => add(m)}>
                {m.displayName}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
