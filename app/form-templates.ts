import rawTemplates from "./form-templates-data.json";

export type FormTemplateSource = {
  label: string;
  url: string;
};

export type FormTemplate = {
  id: string;
  code: string;
  title: string;
  summary: string;
  groupId: string;
  groupTitle: string;
  sourceDocumentId: string;
  sourceDocumentTitle: string;
  docxRelativePath: string;
  downloadUrl: string;
  sources: FormTemplateSource[];
  status: "proposal";
  previewPages: string[];
  pageCount: number;
};

export const formTemplates = rawTemplates as FormTemplate[];

export const formTemplateGroups = Array.from(
  formTemplates.reduce((groups, template) => {
    if (!groups.has(template.groupId)) {
      groups.set(template.groupId, {
        id: template.groupId,
        title: template.groupTitle,
        sourceDocumentId: template.sourceDocumentId,
        sourceDocumentTitle: template.sourceDocumentTitle,
        templates: [] as FormTemplate[],
      });
    }
    groups.get(template.groupId)?.templates.push(template);
    return groups;
  }, new Map<string, {
    id: string;
    title: string;
    sourceDocumentId: string;
    sourceDocumentTitle: string;
    templates: FormTemplate[];
  }>())
  .values(),
);

const missingDocumentTemplates: Record<string, string> = {
  "missing-5": "archiwum-rejestr-pieczeci",
  "missing-6": "skreslenie-karta-obiegowa",
};

export function formTemplateHref(id: string) {
  return `/wzory/${id}`;
}

export function templatesForDocument(documentId: string) {
  return formTemplates.filter((template) => template.sourceDocumentId === documentId);
}

export function templateForMissingDocument(missingDocumentId: string) {
  const templateId = missingDocumentTemplates[missingDocumentId];
  return formTemplates.find((template) => template.id === templateId);
}
