import Link from "next/link";
import { notFound } from "next/navigation";
import { siteStats, statuteChapters } from "../../content";
import { renderStructuredText, statuteChapterHref } from "../../content-utils";

type PageProps = {
  params: Promise<{
    chapterId: string;
  }>;
};

export function generateStaticParams() {
  return statuteChapters.map((chapter) => ({
    chapterId: chapter.id,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { chapterId } = await params;
  const chapter = statuteChapters.find((item) => item.id === chapterId);

  return {
    title: chapter ? `${chapter.title} | Statut ZSZ nr 5` : "Statut ZSZ nr 5",
  };
}

export default async function StatuteChapterPage({ params }: PageProps) {
  const { chapterId } = await params;
  const chapter = statuteChapters.find((item) => item.id === chapterId);

  if (!chapter) notFound();

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
            <Link href="/statut">Statut</Link>
            <Link href="/wzory">Wzory pism</Link>
            <Link href="/braki">Braki</Link>
          </div>
        </nav>
      </header>

      <section className="statute-section">
        <div className="section-heading">
          <p>Statut tekstowy</p>
          <h1>{chapter.title}</h1>
          <p className="section-lead">
            Wyświetlany jest tylko jeden rozdział. Pozostałe rozdziały są dostępne z menu po lewej stronie.
          </p>
        </div>
        <div className="reader-layout">
          <aside className="reader-toc" aria-label="Spis treści statutu">
            <div className="reader-toc-header">
              <strong>{statuteChapters.length}</strong>
              <span>rozdziałów</span>
            </div>
            <a className="reader-download" href={siteStats.statuteDownload}>
              Pobierz oryginalny PDF
            </a>
            <nav>
              {statuteChapters.map((item) => (
                <Link className={item.id === chapter.id ? "active" : ""} href={statuteChapterHref(item.id)} key={item.id}>
                  {item.title}
                </Link>
              ))}
            </nav>
          </aside>
          <div className="statute-reader">
            {chapter.sections.map((section) => (
              <article className="reader-article" id={section.id} key={section.id}>
                <span>{section.chapter}</span>
                <h2>{section.title}</h2>
                <div className="reader-text">{renderStructuredText(section.body)}</div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
