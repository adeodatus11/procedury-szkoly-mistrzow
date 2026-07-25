import rawData from "./statute-proposals-data.json";

type StatuteSection = {
  id: string;
  title: string;
  body: string;
};

type ProposalKind = "legal-update" | "simplification" | "consolidation";

type StatuteProposalUpdate = {
  kind: ProposalKind;
  label: string;
  rationale: string;
  title?: string;
  body?: string;
  replacements?: [string, string][];
};

export type StatuteProposal = {
  title: string;
  body: string;
  kind: ProposalKind | "unchanged";
  label: string;
  rationale: string;
  changed: boolean;
};

export const statuteProposalMeta = {
  asOf: rawData.asOf,
  notice: rawData.notice,
  method: rawData.method,
  sources: rawData.sources,
};

const proposalUpdates = rawData.proposals as Record<string, StatuteProposalUpdate>;

export const statuteProposalChangeCount = Object.keys(proposalUpdates).length;

function applyReplacements(value: string, replacements: [string, string][] = []) {
  return replacements.reduce((result, [from, to]) => result.replace(from, to), value);
}

export function getStatuteProposal(section: StatuteSection): StatuteProposal {
  const update = proposalUpdates[section.id];

  if (!update) {
    return {
      title: section.title,
      body: section.body,
      kind: "unchanged",
      label: "bez proponowanej zmiany",
      rationale: "",
      changed: false,
    };
  }

  return {
    title: update.title ?? applyReplacements(section.title, update.replacements),
    body: update.body ?? applyReplacements(section.body, update.replacements),
    kind: update.kind,
    label: update.label,
    rationale: update.rationale,
    changed: true,
  };
}
