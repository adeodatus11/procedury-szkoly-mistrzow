"use client";

type PrintMode = "comparison" | "current" | "proposed";

const labels: Record<PrintMode, string> = {
  comparison: "Drukuj porównanie",
  current: "Tylko tekst aktualny",
  proposed: "Tylko propozycję",
};

export function PrintToolbar() {
  const print = (mode: PrintMode) => {
    document.body.setAttribute("data-print-mode", mode);
    window.addEventListener("afterprint", () => {
      document.body.removeAttribute("data-print-mode");
    }, { once: true });
    window.print();
  };

  return (
    <div className="print-toolbar" aria-label="Drukowanie i eksport">
      <strong>Druk i eksport</strong>
      {(["comparison", "current", "proposed"] as PrintMode[]).map((mode) => (
        <button key={mode} onClick={() => print(mode)} type="button">
          {labels[mode]}
        </button>
      ))}
      <a href="/reports/Wykaz_proponowanych_zmian_statutu_ZSZ5.pdf">Raport PDF</a>
    </div>
  );
}
