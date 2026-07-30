import rawData from "./statute-major-changes.json";

export type StatuteMajorChangeSource = {
  kind: string;
  label: string;
  url: string;
  note: string;
};

export type StatuteMajorChange = {
  id: string;
  title: string;
  leadEntryId: string;
  entryIds: string[];
  summary: string;
  legalBasis: string;
  editorialDecision: string;
  sourceShape: string;
  sources: StatuteMajorChangeSource[];
};

export type StatuteMajorChangeContext = {
  change: StatuteMajorChange;
  isLead: boolean;
};

export const statuteMajorChangeVerifiedAsOf = rawData.verifiedAsOf;
export const statuteMajorChanges = rawData.majorChanges as StatuteMajorChange[];

const majorChangeByEntryId = new Map<string, StatuteMajorChange>();

for (const change of statuteMajorChanges) {
  for (const entryId of change.entryIds) majorChangeByEntryId.set(entryId, change);
}

export function getStatuteMajorChange(entryId: string): StatuteMajorChangeContext | undefined {
  const change = majorChangeByEntryId.get(entryId);
  if (!change) return undefined;

  return {
    change,
    isLead: change.leadEntryId === entryId,
  };
}
