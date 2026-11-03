import { describe, expect, it } from "vitest";
import { formatDate } from "./date";

describe("formatDate", () => {
  // 3 h UTC le 2 mars = encore le 1er mars à Montréal
  const lateEvening = new Date("2026-03-02T03:00:00Z");

  it("affiche la date de Montréal, pas celle d'UTC", () => {
    expect(formatDate(lateEvening, "long")).toBe("1 mars 2026");
  });

  it("utilise le format moyen par défaut", () => {
    expect(formatDate(lateEvening)).toBe(new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium", timeZone: "America/Toronto" }).format(lateEvening));
  });
});
