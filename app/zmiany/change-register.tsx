"use client";

import { useMemo, useState } from "react";
import { getStructuredLineClassName, renderStructuredText } from "../content-utils";
import { buildInlineDiff, buildTextDiff } from "../statute-diff.mjs";
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

function DiffSegments({ segments }: { segments: ReturnType<typeof buildInlineDiff> }) {
  return segments.map((segment, index) =>
    segment.kind === "unchanged" ? (
      segment.text
    ) : (
      <span className={`statute-diff statute-diff-${segment.kind}`} key={`${segment.kind}-${index}`}>
        {segment.text}
      </span>
    ),
  );
}

function StatuteDiffBody({ current, proposed }: { current: string; proposed: string }) {
  return buildTextDiff(current, proposed).map((line, index) => (
    <p className={`${getStructuredLineClassName(line.source)} statute-diff-line`} key={`${line.source.slice(0, 28)}-${index}`}>
      <DiffSegments segments={line.segments} />
    </p>
  ));
}

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
            <header className="change-entry-header">
              <div className="change-entry-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="change-entry-copy">
                <div className="change-entry-meta">
                  <span>{entry.label}</span>
                  <strong>{entry.chapterTitle}</strong>
                </div>
                <a className="change-entry-link" href={`/statut/${entry.chapterId}/#${entry.id}`}>
                  Otwórz zmianę w rozdziale
                </a>
              </div>
            </header>
            <div className="change-entry-comparison">
              <section className="statute-version statute-version-current" aria-label={`Aktualne brzmienie ${entry.currentTitle}`}>
                <div className="statute-version-heading">
                  <span>Aktualne brzmienie</span>
                  <small>tekst z 15.10.2025 r.</small>
                </div>
                <h2>{entry.currentTitle}</h2>
                <div className="reader-text">{renderStructuredText(entry.currentBody)}</div>
              </section>
              <section
                className={`statute-version statute-version-proposed proposal-${entry.kind}`}
                aria-label={`Proponowane brzmienie ${entry.proposedTitle}`}
              >
                <div className="statute-version-heading">
                  <span>Proponowane brzmienie</span>
                  <small>{entry.label}</small>
                </div>
                <h2>
                  <DiffSegments segments={buildInlineDiff(entry.currentTitle, entry.proposedTitle)} />
                </h2>
                <div className="reader-text">
                  <StatuteDiffBody current={entry.currentBody} proposed={entry.proposedBody} />
                </div>
                <p className="statute-rationale">{entry.rationale}</p>
              </section>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
