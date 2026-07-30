import type { MouseEventHandler } from "react";
import type { StatuteMajorChangeContext } from "./statute-major-changes";
import { statuteMajorChangeVerifiedAsOf } from "./statute-major-changes";

type Props = {
  context?: StatuteMajorChangeContext;
  onReferenceClick?: MouseEventHandler<HTMLAnchorElement>;
};

function isExternal(url: string) {
  return /^https?:\/\//.test(url);
}

export function StatuteMajorChangeJustification({ context, onReferenceClick }: Props) {
  if (!context) return null;

  const { change, isLead } = context;

  if (!isLead) {
    return (
      <p className="major-change-reference">
        <strong>Część zmiany dużego zakresu.</strong>{" "}
        <a
          data-major-change-reference
          href={`/zmiany/#change-${change.leadEntryId}`}
          onClick={onReferenceClick}
        >
          Zobacz szczegółowe uzasadnienie i źródła przy zmianie głównej.
        </a>
      </p>
    );
  }

  return (
    <section className="major-change-justification" id={`justification-${change.id}`}>
      <header className="major-change-heading">
        <div>
          <span>Zmiana dużego zakresu</span>
          <h3>Szczegółowe uzasadnienie</h3>
        </div>
        <small>Źródła sprawdzone: {statuteMajorChangeVerifiedAsOf}</small>
      </header>
      <h4>{change.title}</h4>
      <p className="major-change-summary">{change.summary}</p>
      <dl className="major-change-reasons">
        <div>
          <dt>Co wynika z prawa</dt>
          <dd>{change.legalBasis}</dd>
        </div>
        <div>
          <dt>Decyzja redakcyjna</dt>
          <dd>{change.editorialDecision}</dd>
        </div>
        <div>
          <dt>Źródło proponowanego kształtu</dt>
          <dd>{change.sourceShape}</dd>
        </div>
      </dl>
      <div className="major-change-sources">
        <h4>Źródła przypisane do tej zmiany</h4>
        <ul>
          {change.sources.map((source) => {
            const external = isExternal(source.url);
            return (
              <li key={`${source.kind}-${source.url}`}>
                <span>{source.kind}</span>
                <div>
                  <a
                    href={source.url}
                    rel={external ? "noreferrer" : undefined}
                    target={external ? "_blank" : undefined}
                  >
                    {source.label}
                  </a>
                  <p>{source.note}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
