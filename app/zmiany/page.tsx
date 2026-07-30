import { statuteProposalMeta } from "../statute-proposals";
import { statuteChangeEntries, statuteChangeKinds } from "../statute-change-register";
import { ChangeRegister } from "./change-register";

export const metadata = {
  title: "Centrum zmian statutu | Procedury Szkoły Mistrzów",
};

export default function ChangesPage() {
  return (
    <main>
      <section className="changes-hero">
        <p className="eyebrow">Centrum zmian statutu</p>
        <h1>Rejestr proponowanych zmian</h1>
        <p className="lead">
          Po lewej stronie znajduje się aktualna treść paragrafu, a po prawej proponowane brzmienie. Każdą
          pozycję można również otworzyć w kontekście właściwego rozdziału statutu.
        </p>
        <div className="verification-banner">
          <strong>PROPOZYCJA ROBOCZA</strong>
          <span>{statuteProposalMeta.notice}</span>
        </div>
        <div className="statute-diff-legend changes-diff-legend" aria-label="Legenda oznaczeń zmian">
          <strong>Oznaczenia zmian:</strong>
          <span>
            <span className="statute-diff statute-diff-removed">tekst usunięty</span>
          </span>
          <span>
            <span className="statute-diff statute-diff-changed">tekst zmieniony</span>
          </span>
          <span>
            <span className="statute-diff statute-diff-added">tekst nowy</span>
          </span>
        </div>
        <div className="change-summary" aria-label="Podsumowanie zmian">
          <div>
            <strong>{statuteChangeEntries.length}</strong>
            <span>proponowanych zmian</span>
          </div>
          {statuteChangeKinds.map((kind) => (
            <div key={kind.id}>
              <strong>{kind.count}</strong>
              <span>{kind.label.toLocaleLowerCase("pl")}</span>
            </div>
          ))}
        </div>
        <div className="change-actions">
          <a className="primary-action" href="/reports/Wykaz_proponowanych_zmian_statutu_ZSZ5.pdf">
            Pobierz raport PDF
          </a>
          <a className="secondary-action" href="/zmiany/druk/">
            Otwórz wersję do druku
          </a>
        </div>
      </section>
      <section className="changes-index" aria-label="Rejestr zmian">
        <ChangeRegister entries={statuteChangeEntries} />
      </section>
    </main>
  );
}
