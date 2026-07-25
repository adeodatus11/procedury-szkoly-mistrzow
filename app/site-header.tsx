"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type SearchEntry = {
  id: string;
  type: string;
  category: string;
  title: string;
  excerpt: string;
  href: string;
  keywords: string;
};

function normalize(value: string) {
  return value
    .toLocaleLowerCase("pl")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const links = [
  { href: "/#dokumenty", label: "Dokumenty", section: "" },
  { href: "/statut", label: "Statut", section: "/statut" },
  { href: "/zmiany", label: "Zmiany", section: "/zmiany" },
  { href: "/wzory", label: "Wzory", section: "/wzory" },
  { href: "/pakiety", label: "Paczki ZIP", section: "/pakiety" },
  { href: "/braki", label: "Braki", section: "/braki" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/global-search-data.json")
      .then((response) => response.json())
      .then((data) => {
        if (active) setEntries(data.entries ?? []);
      })
      .catch(() => {
        if (active) setEntries([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const closeSearch = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeSearch);
    return () => document.removeEventListener("mousedown", closeSearch);
  }, []);

  const results = useMemo(() => {
    const needle = normalize(query.trim());
    if (needle.length < 2) return [];

    return entries
      .map((entry) => {
        const title = normalize(entry.title);
        const haystack = normalize(
          `${entry.title} ${entry.type} ${entry.category} ${entry.excerpt} ${entry.keywords}`,
        );
        const score = title.startsWith(needle) ? 0 : title.includes(needle) ? 1 : haystack.includes(needle) ? 2 : 3;
        return { entry, score };
      })
      .filter((result) => result.score < 3)
      .sort((a, b) => a.score - b.score || a.entry.title.localeCompare(b.entry.title, "pl"))
      .slice(0, 8)
      .map((result) => result.entry);
  }, [entries, query]);

  return (
    <header className="site-header">
      <nav className="topbar" aria-label="Główna nawigacja">
        <Link className="brand" href="/">
          <img src="/assets/logo.png" alt="procedury.szkolamistrzow.info" />
        </Link>
        <div className="topbar-main">
          <div className="topbar-links">
            <Link href="/">Strona główna</Link>
            {links.map((link) => (
              <Link
                aria-current={link.section && pathname.startsWith(link.section) ? "page" : undefined}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="global-search" ref={searchRef} role="search">
            <label className="visually-hidden" htmlFor="global-search">
              Szukaj w całym serwisie
            </label>
            <input
              aria-autocomplete="list"
              aria-controls="global-search-results"
              aria-expanded={open}
              id="global-search"
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpen(false);
              }}
              placeholder="Szukaj w całym serwisie"
              role="combobox"
              type="search"
              value={query}
            />
            {open && query.trim().length >= 2 ? (
              <div className="global-search-results" id="global-search-results" role="listbox">
                {results.length ? (
                  results.map((entry) => (
                    <a aria-selected="false" href={entry.href} key={entry.id} onClick={() => setOpen(false)} role="option">
                      <span>{entry.type}</span>
                      <strong>{entry.title}</strong>
                      <small>{entry.excerpt}</small>
                    </a>
                  ))
                ) : (
                  <p>Brak wyników.</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </nav>
    </header>
  );
}
