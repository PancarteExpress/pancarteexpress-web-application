import { describe, expect, it } from "vitest";
import { buildLocaleUrl, getActivePath } from "./pathname";

describe("buildLocaleUrl", () => {
  it("conserve la query string et le hash", () => {
    expect(buildLocaleUrl("/fr/register/account", "?plan=solo", "#top", "fr", "en"))
      .toBe("/en/register/account?plan=solo#top");
  });

  it("fonctionne sans query ni hash", () => {
    expect(buildLocaleUrl("/en/services", "", "", "en", "fr")).toBe("/fr/services");
  });

  it("gère la racine de la locale", () => {
    expect(buildLocaleUrl("/fr", "?a=1", "", "fr", "en")).toBe("/en?a=1");
  });

  it("ne remplace que le préfixe, pas une occurrence plus loin dans le chemin", () => {
    expect(buildLocaleUrl("/fr/shop/fr", "", "", "fr", "en")).toBe("/en/shop/fr");
    expect(buildLocaleUrl("/fr/france", "", "", "fr", "en")).toBe("/en/france");
  });
});

describe("getActivePath", () => {
  it("retire le préfixe de locale", () => {
    expect(getActivePath("/fr/shop")).toBe("/shop");
    expect(getActivePath("/en")).toBe("/");
  });
});
