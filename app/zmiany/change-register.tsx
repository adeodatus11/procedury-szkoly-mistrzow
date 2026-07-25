"use client";

import { useMemo, useState } from "react";
import type { StatuteChangeEntry } from "../statute-change-register";

type Props = {
  entries: StatuteChangeEntry[];
};

const filters = [
  { id: "all", label: "Wszystkie" },
  { id: "legal-update", label: "Aktualizacje prawa" },
  { id: "simplification", label: "Uproszczenia" },
  { id: "consolidation", label: "Scalenia" },
] as const;

export function ChangeRegister({ entries }: Props) {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const visibleEntries = useMemo(
    () => entries.filter((entry) => filter === "all" || entry.kind === filter),
    [entries, filter],
  );

  return (
    <>
      <div className="change-filters" aria-label="Filtry zmian">
        {filters.map((item) => (
          <button
            aria-pressed={filter === item.id}
            className={filter === item.id ? "active" : ""}
            key={item.id}
            onClick={() => setFilter(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="change-register" aria-live="polite">
        {visibleEntries.map((entry, index) => (
          <article className={`change-entry change-${entry.kind}`} id={`change-${entry.id}`} key={entry.id}>
            <div className="change-entry-number">{String(index + 1).padStart(2, "0")}</div>
            <div className="change-entry-copy">
              <div className="change-entry-meta">
                <span>{entry.label}</span>
                <strong>{entry.chapterTitle}</strong>
              </div>
              <h2>{entry.currentTitle}</h2>
              {entry.proposedTitle !== entry.currentTitle ? (
                <p className="change-proposed-title">Proponowany tytuł: {entry.proposedTitle}</p>
              ) : null}
              <p>{entry.rationale}</p>
              <a href={`/statut/${entry.chapterId}/#${entry.id}`}>Otwórz porównanie w rozdziale</a>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
