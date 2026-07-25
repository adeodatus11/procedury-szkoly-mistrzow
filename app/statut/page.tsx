import Link from "next/link";
import { statuteChapters } from "../content";
import { statuteChapterHref } from "../content-utils";

export default function StatuteIndexPage() {
  const firstChapter = statuteChapters[0];

  return (
    <main>
      <header className="site-header">
        <nav className="topbar" aria-label="Główna nawigacja">
          <Link className="brand" href="/">
            <img src="/assets/logo.png" alt="procedury.szkolamistrzow.info" />
          </Link>
          <div className="topbar-links">
            <Link href="/">Strona główna</Link>
            <Link href="/#dokumenty">Dokumenty</Link>
            <Link href="/wzory">Wzory pism</Link>
            <Link href="/braki">Braki</Link>
          </div>
        </nav>
      </header>

      <section className="statute-section">
        <div className="section-heading">
          <p>Porównanie statutu</p>
          <h1>Aktualne brzmienie i propozycja</h1>
          <p className="section-lead">
            Wybierz rozdział, aby porównać obowiązujący tekst z umiarkowanie uproszczoną propozycją. Każdy rozdział
            otwiera się jako osobna strona.
          </p>
        </div>
        <div className="reader-layout">
          <aside className="reader-toc" aria-label="Spis treści statutu">
            <div className="reader-toc-header">
              <strong>{statuteChapters.length}</strong>
              <span>rozdziałów</span>
            </div>
            <nav>
              {statuteChapters.map((chapter) => (
                <Link href={statuteChapterHref(chapter.id)} key={chapter.id}>
                  {chapter.title}
                </Link>
              ))}
            </nav>
          </aside>
          <article className="reader-article chapter-teaser">
            <span>Start</span>
            <h2>{firstChapter?.title ?? "Statut"}</h2>
            <p>
              Po lewej stronie zobaczysz tekst z 15 października 2025 r., a po prawej proponowane brzmienie i
              uzasadnienie zmiany.
            </p>
            {firstChapter ? (
              <Link className="section-link" href={statuteChapterHref(firstChapter.id)}>
                Otwórz pierwszy rozdział
              </Link>
            ) : null}
          </article>
        </div>
      </section>
    </main>
  );
}
