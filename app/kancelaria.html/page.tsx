"use client";

import { useMemo, useState } from "react";

type FolderNode = {
  id: string;
  name: string;
  title: string;
  audience: string;
  access: string;
  keep: string[];
  naming: string[];
  avoid: string[];
  children?: FolderNode[];
};

const folderTree: FolderNode = {
  id: "root",
  name: "Kancelaria_ZSZ5",
  title: "Glowny folder roboczy kancelarii",
  audience: "Wszyscy pracownicy, ktorzy pracuja z dokumentami szkoly.",
  access: "Widok startowy szeroki, dostepy szczegolowe wedlug folderow ponizej.",
  keep: [
    "Dokumenty ulozone wedlug obszaru pracy, a nie wedlug JRWA.",
    "Instrukcje startowe, spisy spraw, foldery robocze i roczne archiwum pomocnicze.",
  ],
  naming: [
    "Foldery najwyzszego poziomu maja numer, zeby kolejnosc byla stala w OneDrive.",
    "Dokumenty opisujemy nazwa pliku plus wpisem w ewidencji albo spisie spraw.",
  ],
  avoid: [
    "Nie przenosic tu starych zasobow masowo bez przegladu.",
    "Nie traktowac folderu jako oficjalnego archiwum zamiast uzgodnionej skladnicy akt.",
  ],
  children: [
    {
      id: "start",
      name: "00_START_TUTAJ",
      title: "Mapa i zasady korzystania",
      audience: "Kazdy nowy uzytkownik struktury.",
      access: "Dostep dla wszystkich pracownikow korzystajacych z kancelarii.",
      keep: [
        "Mapa folderow i zasad.",
        "Lista osob odpowiedzialnych za obszary.",
        "Instrukcje obiegu dokumentow i wzory opisow.",
      ],
      naming: ["Pliki zaczynaj od `00_`, jezeli maja byc widoczne na gorze folderu."],
      avoid: ["Nie trzymac tu pism uczniowskich, skanow ani wersji roboczych spraw."],
    },
    {
      id: "dyrekcja",
      name: "01_DYREKCJA",
      title: "Decyzje, nadzor i sprawy kierownicze",
      audience: "Dyrektor, wicedyrektorzy i osoby upowaznione.",
      access: "Ograniczony do dyrekcji; wybrane podfoldery mozna udostepniac sekretariatowi.",
      keep: [
        "Zarzadzenia, decyzje, materialy rady pedagogicznej.",
        "Organizacja roku szkolnego, nadzor pedagogiczny, kontrole i sprawozdania.",
        "Korespondencja dyrektora wymagajaca decyzji albo nadzoru.",
      ],
      naming: [
        "`2026-09-18_DYR_zarzadzenie-nr-12_organizacja-egzaminow_PODPISANE.pdf`",
        "`2026-10-03_DYR_protokol-rady-pedagogicznej_RP_PODPISANE.pdf`",
      ],
      avoid: ["Nie trzymac tu codziennej korespondencji, ktora obsluguje sekretariat bez decyzji dyrekcji."],
      children: [
        child("Zarzadzenia_i_decyzje", "Podpisane akty dyrektora, decyzje i ich rejestry pomocnicze."),
        child("Rada_Pedagogiczna", "Porzadki obrad, uchwaly, protokoly i materialy na posiedzenia."),
        child("Organizacja_roku_szkolnego", "Arkusz, plany, kalendarze, przydzialy i organizacja pracy."),
        child("Nadzor_pedagogiczny", "Plany nadzoru, obserwacje, wnioski i sprawozdania."),
        child("Kontrole_audyty_sprawozdania", "Kontrole zewnetrzne, audyty, odpowiedzi i zalecenia."),
        child("Korespondencja_dyrektora", "Pisma wymagajace stanowiska albo podpisu dyrektora."),
        child("Robocze_dyrekcja", "Materialy w toku, ktore nie sa jeszcze dokumentem koncowym."),
      ],
    },
    {
      id: "sekretariat-dyrektora",
      name: "02_SEKRETARIAT_DYREKTORA",
      title: "Obieg pism i spraw administracyjnych",
      audience: "Sekretariat dyrektora, dyrekcja i osoby wskazane do prowadzenia spraw.",
      access: "Podstawowy dostep dla sekretariatu i dyrekcji; pisma wrazliwe tylko osobom upowaznionym.",
      keep: [
        "Pisma przychodzace, wychodzace i wytworzone.",
        "Sprawy do dekretacji, do podpisu, do wyslania.",
        "Rejestry, ewidencje, umowy i publikacje na strone/BIP.",
      ],
      naming: [
        "`2026-09-12_SEKR_pismo-z-UMWroclaw_dotacja_PRZYJETE.pdf`",
        "`2026-09-14_SEKR_odpowiedz-do-kuratorium_kontrola_DO_PODPISU.docx`",
      ],
      avoid: ["Nie zostawiac spraw w `Do_dekretacji` dluzej niz kilka dni bez wpisu w ewidencji."],
      children: [
        child("Do_dekretacji", "Tymczasowo: pisma, ktorym dyrektor ma przypisac osobe, termin albo sposob zalatwienia."),
        child("Do_podpisu", "Dokumenty gotowe merytorycznie, oczekujace na podpis."),
        child("Do_wyslania", "Podpisane dokumenty, ktore trzeba wyslac i potwierdzic wysylke."),
        child("Pisma_przychodzace", "Skan PDF, data wplywu, numer i lokalizacja wpisana w ewidencji."),
        child("Pisma_wychodzace_i_wytworzone", "Wersja podpisana PDF oraz ewentualny plik roboczy DOCX."),
        child("Rejestry_i_ewidencje", "Ewidencja dokumentow, rejestry decyzji, pieczeci, upowaznien i spisy pomocnicze."),
        child("Umowy_sprawy_administracyjne", "Umowy, uzgodnienia, sprawy organizacyjne i administracyjne."),
        child("Publikacja_strona_BIP", "Materialy zatwierdzone do publikacji oraz slady publikacji."),
      ],
    },
    {
      id: "sekretariat-uczniowski",
      name: "03_SEKRETARIAT_UCZNIOWSKI",
      title: "Dokumentacja uczniowska i obsluga ucznia",
      audience: "Sekretariat uczniowski, dyrekcja i osoby upowaznione.",
      access: "Ograniczony, bo wiele dokumentow zawiera dane uczniow i rodzicow.",
      keep: [
        "Rekrutacja, uczniowie aktywni, absolwenci i uczniowie byli.",
        "Zaswiadczenia, legitymacje, duplikaty, egzaminy, praktyki.",
        "Sprawy uczniowskie wymagajace wyjasnienia.",
      ],
      naming: [
        "`2026-09-05_UCZ_zaswiadczenie-o-nauce_Nowak-Anna_WYDANE.pdf`",
        "`2026-09-20_UCZ_wniosek-o-duplikat-legitymacji_3TP_Kowalski-Jan_PRZYJETE.pdf`",
      ],
      avoid: ["Nie trzymac tu dokumentacji PPP, jezeli powinna byc w folderze z ograniczonym dostepem PPP."],
      children: [
        child("Rekrutacja", "Wnioski, listy, korespondencja i rozstrzygniecia dotyczace naboru."),
        child("Uczniowie_aktywne_klasy", "Dokumenty uczniow podzielone rokiem szkolnym i klasa."),
        child("Absolwenci_i_uczniowie_byli", "Sprawy po zakonczeniu nauki, przeniesienia i wydane dokumenty."),
        child("Zaswiadczenia_legitymacje_duplikaty", "Wnioski, wydania i potwierdzenia odbioru."),
        child("Egzaminy_klasyfikacyjne_poprawkowe", "Wnioski, decyzje, harmonogramy, protokoly."),
        child("Praktyki_i_ksztalcenie_zawodowe", "Sprawy uczniowskie zwiazane z praktyczna nauka zawodu."),
        child("Sprawy_do_wyjasnienia", "Tymczasowo: dokumenty wymagajace ustalenia trybu albo brakujacych danych."),
      ],
    },
    {
      id: "ppp",
      name: "04_POMOC_PSYCHOLOGICZNO_PEDAGOGICZNA",
      title: "Dokumentacja PPP i wsparcia ucznia",
      audience: "Zespol PPP, dyrekcja, pedagog, psycholog, specjalisci; wychowawca tylko w zakresie koniecznym.",
      access: "Scisle ograniczenie dostepu. To obszar dokumentow wrazliwych.",
      keep: [
        "Wnioski, opinie, orzeczenia, IPET, WOPFU, dostosowania i notatki zespolu.",
        "Ustalenia z poradniami i instytucjami.",
        "Roczne foldery uczniow objetych pomoca.",
      ],
      naming: [
        "`2026-09-12_PPP_wniosek_2A_uczen-014_PRZYJETE.pdf`",
        "`2026-10-01_PPP_ustalenia-zespolu_2A_uczen-014_PODPISANE.pdf`",
      ],
      avoid: [
        "Nie wpisywac pelnego opisu zdrowia w nazwie pliku.",
        "Nie udostepniac calego folderu PPP szerokiej grupie nauczycieli.",
      ],
      children: [
        child("Procedury_i_wzory", "Wzory wnioskow, kart analizy, notatek i ustalen."),
        child("Uczniowie_objeci_pomoca", "Foldery roczne uczniow, najlepiej z neutralnym identyfikatorem."),
        child("Orzeczenia_opinie_zalecenia", "Skan dokumentow z poradni i zalecen."),
        child("IPET_WOPFU_dostosowania", "Dokumenty tworzone przez zespol oraz zatwierdzone dostosowania."),
        child("Spotkania_zespolu_PPP", "Porzadki, protokoly, ustalenia i listy obecnosci."),
        child("Wspolpraca_z_poradniami_i_instytucjami", "Pisma i notatki ze wspolpracy z podmiotami zewnetrznymi."),
        child("Archiwum_roczne", "Zamkniete roczniki przed przekazaniem zgodnie z instrukcja archiwalna."),
      ],
    },
    {
      id: "wychowawcy",
      name: "05_WYCHOWAWCY_KLAS",
      title: "Biezaca dokumentacja wychowawcy",
      audience: "Wychowawcy, dyrekcja i wybrane osoby wspierajace klase.",
      access: "Dostep wedlug klasy; nie powinien otwierac dokumentow innych klas bez potrzeby sluzbowej.",
      keep: [
        "Organizacja klasy, zebrania z rodzicami, wycieczki, zgody, klasyfikacja.",
        "Notatki wychowawcze i interwencje bez kopiowania dokumentow PPP, jezeli wystarczy odniesienie.",
      ],
      naming: [
        "`2026-10-03_WYCH_zebranie-z-rodzicami_3TP_PROTOKOL.pdf`",
        "`2026-11-15_WYCH_wycieczka-do-muzeum_2A_ZGODY.pdf`",
      ],
      avoid: ["Nie robic prywatnych archiwow uczniow poza uzgodnionymi folderami szkoly."],
      children: [
        child("2026_2027", "Folder rocznika. W srodku zaklada sie foldery klas, np. `1A_Nazwisko_wychowawcy`."),
      ],
    },
    {
      id: "zespoly-przedmiotowe",
      name: "06_ZESPOLY_PRZEDMIOTOWE",
      title: "Praca zespolow przedmiotowych",
      audience: "Przewodniczacy i czlonkowie zespolow przedmiotowych, dyrekcja.",
      access: "Dostep dla czlonkow danego zespolu i dyrekcji.",
      keep: [
        "Plany pracy, protokoly, wymagania, PZO, analizy wynikow, materialy wspolne.",
        "Uzgodnienia dotyczace programow, podrecznikow i egzaminow.",
      ],
      naming: [
        "`2026-09-09_ZESPOL-HUM_plan-pracy_2026-2027_ROBOCZE.docx`",
        "`2026-11-20_ZESPOL-ZAWODOWE_analiza-wynikow_egzamin-zawodowy.pdf`",
      ],
      avoid: ["Nie trzymac tu dokumentow pojedynczego ucznia, jezeli sa to sprawy sekretariatu albo PPP."],
      children: [
        child("Humanistyczny", "Jezyk polski, historia, WOS i pokrewne obszary."),
        child("Matematyczno_przyrodniczy", "Matematyka, przedmioty przyrodnicze i analizy wynikow."),
        child("Jezyki_obce", "Przedmioty jezykowe, egzaminy, konkursy i materialy zespolu."),
        child("WF_EDB", "WF, EDB, zwolnienia organizacyjne i dokumenty zespolu."),
        child("Zawodowe", "Ksztalcenie zawodowe, pracownie, egzaminy i uzgodnienia branzowe."),
        child("Inne", "Religia, biblioteka i obszary, ktore nie maja osobnego zespolu."),
      ],
    },
    {
      id: "zespoly-zadaniowe",
      name: "07_ZESPOLY_ZADANIOWE_I_PROJEKTY",
      title: "Zespoly czasowe, wydarzenia i projekty",
      audience: "Koordynatorzy, czlonkowie zespolow zadaniowych, dyrekcja.",
      access: "Dostep wedlug skladu zespolu; finanse i dane osobowe tylko osobom upowaznionym.",
      keep: [
        "Ustalenia, harmonogramy, materialy robocze, wersje do publikacji, zamkniecie sprawy.",
        "Projekty szkolne, zespoly ds. wydarzen, rekrutacji, promocji, egzaminow i ewaluacji.",
      ],
      naming: [
        "`2026-09-30_PROJEKT_dzien-otwarty_harmonogram_ROBOCZE.xlsx`",
        "`2026-10-15_ZESPOL_promocja_szablon-komunikatu_ZATWIERDZONE.docx`",
      ],
      avoid: ["Nie zostawiac projektu bez folderu `Zamkniecie_sprawy`, gdy dzialania sie skoncza."],
      children: [
        child("2026_2027", "Rocznik projektow i zespolow. Dla kazdej inicjatywy zaklada sie osobny folder."),
      ],
    },
    {
      id: "szablony",
      name: "08_SZABLONY_WZORY_PAPIER_FIRMOWY",
      title: "Jedno miejsce na wzory i pliki bazowe",
      audience: "Dyrekcja, sekretariaty, osoby przygotowujace pisma i wzory.",
      access: "Szeroki odczyt, edycja tylko dla osob utrzymujacych aktualne wzory.",
      keep: [
        "Aktualne wzory pism, decyzji, formularzy, procedur, logo, stopki i papier firmowy.",
        "Archiwalne wersje szablonow oddzielone od aktualnych.",
      ],
      naming: [
        "`SZABLON_pismo-ogolne_ZSZ5_AKTUALNY.docx`",
        "`SZABLON_decyzja-administracyjna_skreslenie_AKTUALNY.docx`",
      ],
      avoid: ["Nie trzymac tu wypelnionych pism. Tu sa tylko czyste wzory."],
      children: [
        child("Pisma", "Czyste wzory korespondencji."),
        child("Decyzje", "Czyste wzory decyzji i pouczen."),
        child("Formularze", "Czyste formularze do wypelnienia."),
        child("Procedury", "Zatwierdzone i robocze wzory procedur."),
        child("Logotypy_stopki_papier_firmowy", "Pliki graficzne i szablony wizualne szkoly."),
        child("Archiwalne_wersje_szablonow", "Wycofane wersje wzorow, gdy trzeba zachowac slad zmiany."),
      ],
    },
    {
      id: "komunikaty",
      name: "09_KOMUNIKATY_I_PUBLIKACJE",
      title: "Publikacje dla strony, BIP, rodzicow i mediow",
      audience: "Dyrekcja, sekretariat, osoby publikujace komunikaty.",
      access: "Robocze komunikaty z ograniczona edycja; finalne wersje szerzej widoczne wedlug potrzeb.",
      keep: [
        "Komunikaty do publikacji, wersje na strone, BIP, dla rodzicow i do mediow spolecznosciowych.",
        "Potwierdzenia publikacji i finalne PDF-y.",
      ],
      naming: [
        "`2026-09-01_KOM_rozpoczecie-roku_strona_ZATWIERDZONE.docx`",
        "`2026-09-02_KOM_zebrania-z-rodzicami_VULCAN_WYSLANE.pdf`",
      ],
      avoid: ["Nie publikowac z folderu `Do_publikacji`, dopoki dokument nie ma statusu zatwierdzonego."],
      children: [
        child("Do_publikacji", "Materialy gotowe do ostatniej kontroli i publikacji."),
        child("Strona_internetowa", "Tresci i zalaczniki na strone szkoly."),
        child("BIP", "Dokumenty przeznaczone do BIP i potwierdzenia publikacji."),
        child("Rodzice_uczniowie", "Komunikaty dla rodzicow i uczniow, w tym VULCAN."),
        child("Media_spolecznosciowe", "Posty, grafiki, skrocone komunikaty."),
      ],
    },
    {
      id: "archiwum",
      name: "90_ARCHIWUM_ROBOCZE_LAT",
      title: "Roczne archiwum pomocnicze",
      audience: "Osoby porzadkujace zamkniete roczniki spraw.",
      access: "Wedlug obszaru dokumentacji; archiwum nie powinno poszerzac dostepu do danych.",
      keep: [
        "Zamkniete kopie roboczych struktur rocznych.",
        "Materialy przygotowane do przekazania zgodnie z instrukcja archiwalna.",
      ],
      naming: ["Foldery roczne: `2024_2025`, `2025_2026`, `2026_2027`."],
      avoid: ["Nie brakowac dokumentow tylko dlatego, ze sa w archiwum roboczym."],
      children: [
        child("2024_2025", "Zamkniety rocznik pomocniczy."),
        child("2025_2026", "Zamkniety rocznik pomocniczy."),
        child("2026_2027", "Biezacy rocznik przenoszony po zamknieciu spraw."),
      ],
    },
    {
      id: "inbox",
      name: "99_INBOX_DO_SORTOWANIA",
      title: "Tymczasowa poczekalnia dokumentow",
      audience: "Sekretariaty i osoby porzadkujace obieg.",
      access: "Tylko osoby, ktore sortuja i przekazuja dokumenty dalej.",
      keep: [
        "Dokumenty do skanowania, dekretacji, podpisu, wyslania, publikacji lub uzupelnienia.",
        "Pliki powinny szybko przechodzic do wlasciwego obszaru.",
      ],
      naming: [
        "`2026-09-12_INBOX_pismo-od-rodzica_2A_DO_DEKRETACJI.pdf`",
        "`2026-09-13_INBOX_odpowiedz-do-urzedu_DO_PODPISU.docx`",
      ],
      avoid: ["Nie przechowywac tu spraw stale. Folder nalezy czyscic regularnie."],
      children: [
        child("Do_dekretacji", "Nie wiadomo jeszcze, kto prowadzi sprawe albo jaki ma byc tryb."),
        child("Do_skanowania", "Dokument papierowy czeka na utrwalenie w PDF."),
        child("Do_podpisu", "Dokument przygotowany do podpisu."),
        child("Do_wyslania", "Dokument podpisany, oczekujacy na wysylke."),
        child("Do_publikacji", "Material zatwierdzony albo prawie gotowy do publikacji."),
        child("Do_uzupelnienia", "Brakuje danych, zalacznika, podpisu albo opisu."),
      ],
    },
  ],
};

function child(name: string, description: string): FolderNode {
  return {
    id: name,
    name,
    title: description,
    audience: "Osoby pracujace w tym obszarze.",
    access: "Zgodnie z uprawnieniami folderu nadrzednego.",
    keep: [description],
    naming: ["Stosuj date, obszar, krotki temat, osobe/klase/sprawe i status."],
    avoid: ["Nie wrzucaj plikow bez opisu i bez jasnego wlasciciela."],
  };
}

function flatten(node: FolderNode, parents: FolderNode[] = []): Array<{ node: FolderNode; parents: FolderNode[] }> {
  return [
    { node, parents },
    ...(node.children ?? []).flatMap((item) => flatten(item, [...parents, node])),
  ];
}

const quickRoutes = [
  ["Wplynelo pismo i nie wiadomo kto prowadzi", "99_INBOX_DO_SORTOWANIA / Do_dekretacji"],
  ["Pismo jest gotowe, ale czeka na podpis", "02_SEKRETARIAT_DYREKTORA / Do_podpisu"],
  ["Rodzic sklada wniosek o zaswiadczenie", "03_SEKRETARIAT_UCZNIOWSKI / Zaswiadczenia_legitymacje_duplikaty"],
  ["Dokument dotyczy opinii, orzeczenia albo IPET", "04_POMOC_PSYCHOLOGICZNO_PEDAGOGICZNA"],
  ["Wychowawca ma protokol zebrania klasy", "05_WYCHOWAWCY_KLAS / 2026_2027 / klasa"],
  ["Zespol przedmiotowy ma plan pracy", "06_ZESPOLY_PRZEDMIOTOWE / nazwa zespolu"],
  ["Powstaje komunikat na strone albo do VULCAN-a", "09_KOMUNIKATY_I_PUBLIKACJE"],
];

export default function KancelariaPage() {
  const nodes = useMemo(() => flatten(folderTree), []);
  const [selectedId, setSelectedId] = useState("root");
  const selected = nodes.find((item) => item.node.id === selectedId) ?? nodes[0];
  const path = [...selected.parents, selected.node];
  const levelNodes = path[path.length - 1].children ?? [];

  return (
    <main className="kancelaria-page">
      <section className="kancelaria-hero">
        <div>
          <p className="kancelaria-kicker">Foldery dla ludzi, klasyfikacja w ewidencji</p>
          <h1>Kancelaria ZSZ nr 5: jak odkładać, opisywać i odnajdywać dokumenty</h1>
          <p className="kancelaria-lead">
            Prosty układ folderów dla dyrekcji, sekretariatów, PPP, wychowawców oraz zespołów. Wejdź w folder,
            zobacz kto z niego korzysta, jakie pliki tam trzymać i jak je nazwać.
          </p>
          <div className="kancelaria-actions">
            <a href="#mapa-folderow">Otwórz mapę folderów</a>
            <a href="#opisywanie">Zasady opisu plików</a>
          </div>
        </div>
        <aside className="kancelaria-rulebox" aria-label="Trzy zasady kancelarii">
          <strong>3 zasady</strong>
          <span>PDF jest wersją końcową</span>
          <span>Nazwa pliku mówi, co to jest</span>
          <span>Ewidencja mówi, kto odpowiada i gdzie leży dokument</span>
        </aside>
      </section>

      <section className="folder-explorer" id="mapa-folderow">
        <div className="folder-copy">
          <h2>Wejdź w strukturę</h2>
          <p>
            Kliknij folder po lewej. Lista pod spodem pokaże kolejny poziom, a opis po prawej wyjaśni przeznaczenie,
            dostęp i przykłady nazw dokumentów.
          </p>
          <div className="breadcrumb" aria-label="Aktualna ścieżka">
            {path.map((item, index) => (
              <button key={item.id} onClick={() => setSelectedId(item.id)} type="button">
                {index ? "/" : ""}
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <div className="folder-stage">
          <div className="folder-layers" aria-label="Mapa folderów">
            <div className="folder-column">
              <button
                className={selected.node.id === "root" ? "folder-item active" : "folder-item"}
                onClick={() => setSelectedId("root")}
                type="button"
              >
                <span>Katalog</span>
                <strong>{folderTree.name}</strong>
              </button>
              {(folderTree.children ?? []).map((item) => (
                <button
                  className={path.some((pathItem) => pathItem.id === item.id) ? "folder-item active" : "folder-item"}
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  type="button"
                >
                  <span>{item.name.slice(0, 2)}</span>
                  <strong>{item.name}</strong>
                </button>
              ))}
            </div>

            <div className="folder-column folder-column-next">
              <div className="folder-column-title">{selected.node.name}</div>
              {levelNodes.length ? (
                levelNodes.map((item) => (
                  <button className="folder-item" key={item.id} onClick={() => setSelectedId(item.id)} type="button">
                    <span>podfolder</span>
                    <strong>{item.name}</strong>
                  </button>
                ))
              ) : (
                <p className="folder-empty">Ten poziom nie ma dalszych podfolderów w strukturze startowej.</p>
              )}
            </div>
          </div>

          <article className="folder-detail" key={selected.node.id}>
            <span className="folder-path">{path.map((item) => item.name).join(" / ")}</span>
            <h3>{selected.node.title}</h3>
            <dl>
              <div>
                <dt>Dla kogo</dt>
                <dd>{selected.node.audience}</dd>
              </div>
              <div>
                <dt>Dostęp</dt>
                <dd>{selected.node.access}</dd>
              </div>
            </dl>
            <div className="folder-detail-grid">
              <DetailList title="Co wkładać" items={selected.node.keep} />
              <DetailList title="Jak opisywać" items={selected.node.naming} />
              <DetailList title="Czego nie robić" items={selected.node.avoid} />
            </div>
          </article>
        </div>
      </section>

      <section className="instruction-section" id="opisywanie">
        <div className="instruction-main">
          <h2>Opis dokumentu ma mieć cztery warstwy</h2>
          <p>
            Sama nazwa folderu nie wystarczy. Dokument powinien być zrozumiały dla osoby, która otworzy go za pół roku:
            po nazwie pliku, po wpisie w ewidencji i po krótkiej karcie sprawy, jeśli sprawa ma kilka dokumentów.
          </p>
        </div>
        <div className="description-steps">
          <article>
            <span>1</span>
            <h3>Nazwa pliku</h3>
            <code>YYYY-MM-DD_OBSZAR_krotki-temat_kogo-dotyczy_STATUS.pdf</code>
            <p>
              Przykład: <code>2026-09-12_PPP_wniosek_2A_uczen-014_PRZYJETE.pdf</code>.
            </p>
          </article>
          <article>
            <span>2</span>
            <h3>Wpis w ewidencji</h3>
            <p>Data, numer pisma, prosty tytuł, osoba odpowiedzialna, status, termin i lokalizacja pliku.</p>
          </article>
          <article>
            <span>3</span>
            <h3>Opis krótki</h3>
            <p>Jedno zdanie: czego dotyczy dokument i jaka czynność ma z niego wynikać.</p>
          </article>
          <article>
            <span>4</span>
            <h3>Karta sprawy</h3>
            <p>
              Dla większej sprawy dodaj <code>00_KARTA_SPRAWY.md</code> z listą dokumentów, decyzji, terminów i uwag.
            </p>
          </article>
        </div>
      </section>

      <section className="examples-section">
        <div>
          <h2>Gotowe pola opisu w OneDrive / SharePoint</h2>
          <p>
            Jeżeli folder działa jako biblioteka dokumentów, warto dodać kolumny. Komentarze mogą służyć do rozmowy
            bieżącej, ale stały opis powinien być w polach obok pliku.
          </p>
        </div>
        <div className="metadata-table" role="table" aria-label="Proponowane pola opisu pliku">
          {[
            ["Opis krótki", "Wniosek rodzica o objęcie ucznia pomocą psychologiczno-pedagogiczną"],
            ["Obszar", "PPP"],
            ["Osoba odpowiedzialna", "pedagog szkolny"],
            ["Status", "w toku"],
            ["Termin", "2026-09-20"],
            ["Numer pisma", "128/2026"],
            ["Dostęp", "ograniczony"],
            ["Lokalizacja", "04_POMOC_PSYCHOLOGICZNO_PEDAGOGICZNA / Uczniowie_objeci_pomoca / 2026_2027"],
          ].map(([label, value]) => (
            <div role="row" key={label}>
              <strong role="cell">{label}</strong>
              <span role="cell">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="routes-section">
        <div className="section-heading">
          <p>Szybkie decyzje</p>
          <h2>Gdzie odłożyć typową sprawę</h2>
        </div>
        <div className="route-list">
          {quickRoutes.map(([question, answer]) => (
            <article key={question}>
              <span>{question}</span>
              <strong>{answer}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="routine-section">
        <h2>Rutyna utrzymania porządku</h2>
        <div>
          <p><strong>Codziennie:</strong> opróżnić <code>Do_skanowania</code>, <code>Do_podpisu</code> i <code>Do_wyslania</code>.</p>
          <p><strong>Raz w tygodniu:</strong> sprawdzić <code>Do_dekretacji</code>, <code>Do_uzupelnienia</code> i dokumenty bez lokalizacji w ewidencji.</p>
          <p><strong>Raz w miesiącu:</strong> przejrzeć foldery robocze i domknąć sprawy zakończone.</p>
          <p><strong>Po roku szkolnym:</strong> przenieść zamknięte roczniki do archiwum roboczego i przygotować je zgodnie z instrukcją archiwalną.</p>
        </div>
      </section>
    </main>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
