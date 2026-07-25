"use client";

export function PrintPageButton() {
  return (
    <button onClick={() => window.print()} type="button">
      Drukuj raport
    </button>
  );
}
