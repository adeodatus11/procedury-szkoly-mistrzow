import { statuteChapters } from "./content";
import { getStatuteProposal } from "./statute-proposals";

export type StatuteChangeEntry = {
  id: string;
  chapterId: string;
  chapterTitle: string;
  currentTitle: string;
  currentBody: string;
  proposedTitle: string;
  proposedBody: string;
  kind: "legal-update" | "simplification" | "consolidation";
  label: string;
  rationale: string;
};

export const statuteChangeEntries: StatuteChangeEntry[] = statuteChapters.flatMap((chapter) =>
  chapter.sections.flatMap((section) => {
    const proposal = getStatuteProposal(section);
    if (!proposal.changed || proposal.kind === "unchanged") return [];

    return [{
      id: section.id,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      currentTitle: section.title,
      currentBody: section.body,
      proposedTitle: proposal.title,
      proposedBody: proposal.body,
      kind: proposal.kind,
      label: proposal.label,
      rationale: proposal.rationale,
    }];
  }),
);

export const statuteChangeKinds = [
  {
    id: "legal-update",
    label: "Aktualizacja prawa",
    count: statuteChangeEntries.filter((entry) => entry.kind === "legal-update").length,
  },
  {
    id: "simplification",
    label: "Uproszczenie",
    count: statuteChangeEntries.filter((entry) => entry.kind === "simplification").length,
  },
  {
    id: "consolidation",
    label: "Scalenie",
    count: statuteChangeEntries.filter((entry) => entry.kind === "consolidation").length,
  },
] as const;
