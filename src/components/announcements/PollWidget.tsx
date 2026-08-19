"use client";

import { useState, useTransition } from "react";
import { voteOnPoll } from "@/lib/announcements-actions";
import type { Poll } from "@/lib/announcements-types";

interface PollWidgetProps {
  poll: Poll;
  isAdmin: boolean;
}

// Sondage attaché à une annonce (CDC 12.6) : choix unique/multiple ou
// évaluation 5 étoiles ; bouton "Voter" grisé tant que rien n'a changé
// depuis le dernier vote ; résultats visibles des admins uniquement.
export function PollWidget({ poll, isAdmin }: PollWidgetProps) {
  const [pending, startTransition] = useTransition();
  const [selectedOptions, setSelectedOptions] = useState<string[]>(poll.myOptionIds);
  const [rating, setRating] = useState<number | null>(poll.myRating);
  const [dirty, setDirty] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const totalVotes = poll.options.reduce((sum, o) => sum + o.voteCount, 0);
  const totalRatingVotes = Object.values(poll.ratingCounts).reduce((a, b) => a + b, 0);

  function toggleOption(id: string) {
    setDirty(true);
    setSelectedOptions((prev) => {
      if (poll.type === "multiple") {
        return prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id];
      }
      return prev.includes(id) ? [] : [id];
    });
  }

  function submitVote() {
    startTransition(() => {
      voteOnPoll(poll.id, poll.type === "rating" ? { rating: rating ?? undefined } : { optionIds: selectedOptions });
      setDirty(false);
    });
  }

  return (
    <div className="ann-poll">
      <div className="poll-question">{poll.question}</div>

      {poll.type === "rating" ? (
        <div className="poll-stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`star-btn ${(rating ?? 0) >= n ? "filled" : ""}`}
              onClick={() => {
                setRating(n);
                setDirty(true);
              }}
            >
              ★
            </button>
          ))}
        </div>
      ) : (
        <div className="poll-options">
          {poll.options.map((o) => (
            <label className="poll-opt" key={o.id}>
              <input
                type={poll.type === "multiple" ? "checkbox" : "radio"}
                checked={selectedOptions.includes(o.id)}
                onChange={() => toggleOption(o.id)}
              />
              {o.label}
            </label>
          ))}
        </div>
      )}

      <div className="poll-actions">
        <button
          type="button"
          className="join-btn"
          disabled={
            pending ||
            !dirty ||
            (poll.type === "rating" ? !rating : selectedOptions.length === 0)
          }
          onClick={submitVote}
        >
          Voter
        </button>
        {isAdmin && (
          <button type="button" className="poll-results-btn" onClick={() => setShowResults((v) => !v)}>
            Voir les résultats
          </button>
        )}
      </div>

      {showResults && (
        <div className="poll-results">
          {poll.type === "rating"
            ? [5, 4, 3, 2, 1].map((n) => {
                const count = poll.ratingCounts[n] ?? 0;
                const pct = totalRatingVotes ? Math.round((count / totalRatingVotes) * 100) : 0;
                return (
                  <div key={n}>
                    {"★".repeat(n)} : {count}, {pct} %
                  </div>
                );
              })
            : poll.options.map((o) => {
                const pct = totalVotes ? Math.round((o.voteCount / totalVotes) * 100) : 0;
                return (
                  <div key={o.id}>
                    {o.label} : {o.voteCount}, {pct} %
                  </div>
                );
              })}
        </div>
      )}
    </div>
  );
}
