import Link from "next/link";
import { formTemplateHref } from "./form-templates";
import type { FormTemplate } from "./form-templates";

type FormTemplateQuickEntryProps = {
  index?: number;
  template: FormTemplate;
  variant?: "catalog" | "compact";
};

export function FormTemplateQuickEntry({
  index,
  template,
  variant = "catalog",
}: FormTemplateQuickEntryProps) {
  const firstPreviewPage = template.previewPages[0];
  const pageLabel = `${template.pageCount} ${template.pageCount === 1 ? "strona" : "strony"}`;

  return (
    <div className={`form-quick-entry form-quick-entry-${variant}`}>
      {index !== undefined ? <span className="form-number">{index + 1}</span> : null}
      <div className="form-quick-copy">
        <span className="form-code">{template.code}</span>
        <div className="form-title-with-preview">
          <Link className="form-title-link" href={formTemplateHref(template.id)}>
            {template.title}
          </Link>
          <aside className="form-hover-preview" aria-hidden="true">
            <div>
              <span>{template.code}</span>
              <strong>DO WERYFIKACJI</strong>
            </div>
            <img
              src={firstPreviewPage}
              alt=""
              decoding="async"
              loading="lazy"
            />
            <p>Podgląd pierwszej strony</p>
          </aside>
        </div>
        {variant === "catalog" ? <p>{template.summary}</p> : null}
      </div>
      <div className="form-quick-actions">
        <span className="form-page-count">{pageLabel}</span>
        <a
          className="form-quick-action form-preview-action"
          href={firstPreviewPage}
          rel="noreferrer"
          target="_blank"
        >
          Podgląd PNG
        </a>
        <a
          className="form-quick-action form-download-action"
          download
          href={template.downloadUrl}
        >
          Pobierz DOCX
        </a>
      </div>
    </div>
  );
}
