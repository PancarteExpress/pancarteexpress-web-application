import { describe, expect, it } from "vitest";
import { formatPersonName, getPersonInitials } from "./personName";

describe("formatPersonName", () => {
  it.each([
    ["jean-philippe", "Jean-Philippe"],
    ["o'neil", "O'Neil"],
    ["o’neil", "O’Neil"],
    ["élise", "Élise"],
    ["marie ève", "Marie Ève"],
    ["ÉMILE", "ÉMILE"],
  ])("%s → %s", (input, expected) => {
    expect(formatPersonName(input)).toBe(expected);
  });

  it("joint prénom et nom avec un seul espace", () => {
    expect(formatPersonName("  jean-philippe ", " tremblay   gagnon ")).toBe("Jean-Philippe Tremblay Gagnon");
  });

  it("garde les majuscules internes saisies", () => {
    expect(formatPersonName("ronald", "McDonald")).toBe("Ronald McDonald");
  });

  it("normalise les accents décomposés (NFD)", () => {
    expect(formatPersonName("élise")).toBe("Élise");
  });

  it("ignore les parties vides ou absentes", () => {
    expect(formatPersonName(null, "lopez", undefined, "")).toBe("Lopez");
    expect(formatPersonName(undefined, null)).toBe("");
  });
});

describe("getPersonInitials", () => {
  it("prend la première lettre du prénom et du nom", () => {
    expect(getPersonInitials("élise", "tremblay")).toBe("ÉT");
  });

  it("compte chaque mot, sans découper les noms composés", () => {
    expect(getPersonInitials("cristian fermin", "lopez")).toBe("CFL");
    expect(getPersonInitials("jean-philippe", "o'neil")).toBe("JO");
  });

  it("se limite à 3 lettres", () => {
    expect(getPersonInitials("anne marie claire", "roy")).toBe("AMC");
  });

  it("renvoie une chaîne vide sans nom", () => {
    expect(getPersonInitials(null, undefined)).toBe("");
  });
});
