# Procedury Szkoły Mistrzów

Publiczna strona z katalogiem procedur, statutu, wzorów dokumentów i instrukcji kancelaryjnej ZSZ nr 5.

## Wymagania

- Node.js `>=22.13.0`

## Komendy

```bash
npm install
npm run dev
npm run build
npm run build:static
npm test
```

## Struktura projektu

- `app/` - widoki strony i komponenty
- `public/` - dokumenty, podglądy, pliki do pobrania i dane wyszukiwania
- `scripts/` - generowanie danych, statycznej wersji GitHub Pages, raportów i audytów
- `tests/` - testy renderowania i spójności treści
- `_site/` - lokalnie wygenerowany artefakt statyczny, niewersjonowany jako źródło

## Publikacja

Publiczna wersja jest budowana z gałęzi `main` przez GitHub Pages. Workflow uruchamia testy, generuje statyczną stronę do `_site` i publikuje artefakt.
