"use client";

import { useMemo, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import { SearchIcon } from "@/components/ui/icons";

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
  /** Affiche "(moi)" sur le chip correspondant à ce profil (CDC 12.3). */
  currentUserId?: string;
  /** Le chip de sélection est rendu séparément par l'appelant (CDC 12.9 : recherche seule puis ligne dédiée chip + bouton). */
  hideSelectedChips?: boolean;
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
  currentUserId,
  hideSelectedChips = false,
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
      .slice(0, 6);
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
      {!hideSelectedChips && selected.length > 0 && (
        <div className="ce-participants">
          {selected.map((m) => (
            <span className="ce-chip" key={m.id}>
              {m.displayName}
              {m.id === currentUserId ? ` ${t("memberPicker.me")}` : ""}
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
        <span className="ce-search-icon">
          <SearchIcon />
        </span>
        <input
          className="form-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={resolvedPlaceholder}
        />
      </div>
      <div className={`ce-member-results ${query.trim() ? "open" : ""}`}>
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
  );
}
