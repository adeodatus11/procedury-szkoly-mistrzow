import { formTemplateGroups, formTemplates } from "./form-templates";

export type DocumentPackage = {
  id: string;
  title: string;
  description: string;
  sourceDocumentId: string;
  sourceDocumentTitle: string;
  filename: string;
  templateCount: number;
};

export const documentPackages: DocumentPackage[] = [
  ...formTemplateGroups.map((group) => ({
    id: group.id,
    title: group.title,
    description: `Komplet wzorów DOCX do obszaru: ${group.title}.`,
    sourceDocumentId: group.sourceDocumentId,
    sourceDocumentTitle: group.sourceDocumentTitle,
    filename: `wzory-${group.id}.zip`,
    templateCount: group.templates.length,
  })),
  {
    id: "wszystkie",
    title: "Wszystkie wzory",
    description: "Pełny komplet wszystkich wzorów DOCX dostępnych w serwisie.",
    sourceDocumentId: "",
    sourceDocumentTitle: "Pełny zestaw formularzy roboczych ZSZ nr 5",
    filename: "wzory-wszystkie.zip",
    templateCount: formTemplates.length,
  },
];

export function documentPackageHref(filename: string) {
  return `/packages/${filename}`;
}
