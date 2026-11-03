import { describe, expect, it } from "vitest";
import { CONTACT, mailtoHref, telHref } from "./contact";

describe("telHref", () => {
  it.each([
    ["514-825-2709", "tel:+15148252709"],
    ["(450) 543 0769", "tel:+14505430769"],
    ["+1 438-543-0912", "tel:+14385430912"],
  ])("%s → %s", (phone, expected) => {
    expect(telHref(phone)).toBe(expected);
  });

  it("donne un lien valide pour chaque téléphone affiché", () => {
    const phones = [CONTACT.mainPhone, CONTACT.commercialPhone, CONTACT.accountingPhone, CONTACT.mobilePhone];
    for (const phone of phones) expect(telHref(phone)).toMatch(/^tel:\+1\d{10}$/);
  });
});

describe("mailtoHref", () => {
  it("pointe vers l'adresse affichée", () => {
    expect(mailtoHref(CONTACT.infoEmail)).toBe("mailto:info@pancarteexpress.com");
  });
});
