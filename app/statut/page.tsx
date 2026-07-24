import { statuteChapters } from "../content";
import { statuteChapterHref } from "../content-utils";

export default function StatuteIndexPage() {
  const firstChapter = statuteChapters[0];

  return (
    <main>
      <header className="site-header">
        <nav className="topbar" aria-label="Główna nawigacja">
          <a className="brand" href="/">
            <img src="/assets/logo.png" alt="procedury.szkolamistrzow.info" />
          </a>
          <div className="topbar-links">
            <a href="/">Strona główna</a>
            <a href="/#dokumenty">Dokumenty</a>
            <a href="/braki">Braki</a>
          </div>
        </nav>
      </header>

      <section className="statute-section">
        <div className="section-heading">
          <p>Statut tekstowy</p>
          <h1>Rozdziały statutu</h1>
          <p className="section-lead">Wybierz rozdział z menu. Każdy rozdział otwiera się jako osobna strona.</p>
        </div>
        <div className="reader-layout">
          <aside className="reader-toc" aria-label="Spis treści statutu">
            <div className="reader-toc-header">
              <strong>{statuteChapters.length}</strong>
              <span>rozdziałów</span>
            </div>
            <nav>
              {statuteChapters.map((chapter) => (
                <a href={statuteChapterHref(chapter.id)} key={chapter.id}>
                  {chapter.title}
                </a>
              ))}
            </nav>
          </aside>
          <article className="reader-article chapter-teaser">
            <span>Start</span>
            <h2>{firstChapter?.title ?? "Statut"}</h2>
            <p>Otwórz pierwszy rozdział albo wybierz dowolny rozdział z menu po lewej.</p>
            {firstChapter ? (
              <a className="section-link" href={statuteChapterHref(firstChapter.id)}>
                Otwórz pierwszy rozdział
              </a>
            ) : null}
          </article>
        </div>
      </section>
    </main>
  );
}
