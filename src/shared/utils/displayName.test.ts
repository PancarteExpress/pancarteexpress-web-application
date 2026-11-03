import { describe, expect, it } from "vitest";
import { getDisplayName, getFullName } from "./displayName";

describe("getFullName", () => {
  it("joint prénom et nom tels que saisis", () => {
    expect(getFullName({ firstName: " Ana ", lastName: "roy" })).toBe("Ana roy");
  });

  it("ignore les parties vides et les personnes absentes", () => {
    expect(getFullName({ firstName: null, lastName: "Roy" })).toBe("Roy");
    expect(getFullName({ firstName: "", lastName: "  " })).toBe("");
    expect(getFullName(undefined)).toBe("");
  });
});

describe("getDisplayName", () => {
  it("préfère le nom complet", () => {
    expect(getDisplayName({ firstName: "Ana", lastName: "Roy", email: "ana@example.com" })).toBe("Ana Roy");
  });

  it("revient au courriel sans nom", () => {
    expect(getDisplayName({ firstName: null, lastName: null, email: "ana@example.com" })).toBe("ana@example.com");
  });
});
