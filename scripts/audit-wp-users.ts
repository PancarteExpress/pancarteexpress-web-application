// scripts/audit-wp-users.ts
// Audit des comptes préparés par migrate-wp.ts (lit preview.json, n'écrit rien).
// Usage : npx tsx scripts/audit-wp-users.ts users_migration/preview.json
import { readFileSync } from "node:fs";

type PreviewUser = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  companyName: string | null;
  createdAt: string;
  passwordFormat: string | null;
};

// Domaines internes : agence de l'ancien site, Pancarte Express
const STAFF_DOMAINS = ["mediasimple.ca", "pancarteexpress.com"];

// Domaines fréquents : un domaine très proche mais différent est probablement une faute de frappe
const COMMON_DOMAINS = [
  "gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "yahoo.ca", "live.ca", "icloud.com",
  "videotron.ca", "sympatico.ca", "remax-quebec.com", "royallepage.ca", "sothebysrealty.ca",
  "engelvoelkers.com", "barnes-international.com", "profusion.global",
];

const BAD_TLD = /\.(con|comm|cm|om|cmo|vom|xom|coom|caa|cs)$/i;
const TEST_WORDS = /\b(test|tester|demo|fake|asdf|qwerty|exemple|example|xxx|aaa|bidon)\b/i;
const BUSINESS_WORDS = /\b(inc|equipe|groupe|team|immobilier|realty|remax|courtier|agence)\b/i;

/** Minuscules, sans accents, lettres seulement. */
const norm = (s: string | null | undefined): string =>
  (s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();

function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = above;
    }
  }
  return row[b.length];
}

function fakePhone(phone: string | null): boolean {
  if (!phone) return false;
  const local = phone.slice(3); // sans l'indicatif régional
  return (
    /^(\d)\1+$/.test(local) || // 999-9999
    /(\d)\1{5,}/.test(phone) || // 6 chiffres identiques d'affilée
    "01234567890".includes(phone) ||
    "9876543210".includes(phone)
  );
}

const label = (u: PreviewUser): string =>
  `${u.email} — ${u.firstName ?? "?"} ${u.lastName ?? "?"} · créé ${u.createdAt.slice(0, 10)}` +
  ` · tél. ${u.phoneNumber ? "oui" : "non"} · entreprise ${u.companyName ? "oui" : "non"}`;

function main(): void {
  const file = process.argv[2];
  if (!file) throw new Error("Usage : npx tsx scripts/audit-wp-users.ts <preview.json>");
  const users: PreviewUser[] = JSON.parse(readFileSync(file, "utf8"));

  // 1. Probablement à éliminer
  const eliminate: string[] = [];
  // 3. À regarder (n'implique pas forcément une suppression)
  const review: string[] = [];

  for (const u of users) {
    const [local = "", domain = ""] = u.email.split("@");
    const problems: string[] = [];

    if (STAFF_DOMAINS.includes(domain)) problems.push("domaine interne ou de l'agence");
    if (BAD_TLD.test(domain)) problems.push(`extension invalide « ${domain} »`);
    if (!COMMON_DOMAINS.includes(domain)) {
      const near = COMMON_DOMAINS.find((d) => levenshtein(d, domain) <= (d.length < 10 ? 1 : 2));
      if (near) problems.push(`domaine « ${domain} » proche de « ${near} »`);
    }
    const allText = `${local} ${u.firstName ?? ""} ${u.lastName ?? ""} ${u.companyName ?? ""}`;
    if (TEST_WORDS.test(allText)) problems.push("mot de test");
    if (fakePhone(u.phoneNumber)) problems.push(`téléphone suspect « ${u.phoneNumber} »`);

    if (problems.length) eliminate.push(`${label(u)}\n      → ${problems.join(", ")}`);

    const notes: string[] = [];
    const first = norm(u.firstName);
    const last = norm(u.lastName);
    if (first && first === last) notes.push("prénom identique au nom");
    if (first.length < 2 || last.length < 2) notes.push("prénom ou nom d'une lettre");
    if (BUSINESS_WORDS.test(norm(`${u.firstName} ${u.lastName}`))) notes.push("nom d'entreprise ou d'équipe à la place d'une personne");
    if (notes.length) review.push(`${label(u)}\n      → ${notes.join(", ")}`);
  }

  // 2. Doublons probables : même personne (prénom + nom, ordre ignoré) ou courriels presque identiques
  const byName = new Map<string, PreviewUser[]>();
  for (const u of users) {
    const key = norm(`${u.firstName} ${u.lastName}`).split(" ").filter(Boolean).sort().join(" ");
    if (!key) continue;
    byName.set(key, [...(byName.get(key) ?? []), u]);
  }
  const duplicateGroups = [...byName.values()].filter((g) => g.length > 1);
  const grouped = new Set(duplicateGroups.flat().map((u) => u.email));

  const similarEmails: [PreviewUser, PreviewUser][] = [];
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const a = users[i];
      const b = users[j];
      if (Math.abs(a.email.length - b.email.length) > 2) continue;
      if (grouped.has(a.email) && grouped.has(b.email)) continue;
      if (levenshtein(a.email, b.email) <= 2) similarEmails.push([a, b]);
    }
  }

  console.log(`${users.length} comptes analysés\n`);

  console.log(`=== 1. Probablement à éliminer (${eliminate.length}) ===`);
  eliminate.forEach((l) => console.log("  -", l));

  console.log(`\n=== 2. Doublons probables — garder un seul compte par personne (${duplicateGroups.length + similarEmails.length}) ===`);
  for (const group of duplicateGroups) {
    console.log("  • Même nom :");
    group.forEach((u) => console.log("      -", label(u)));
  }
  for (const [a, b] of similarEmails) {
    console.log("  • Courriels presque identiques :");
    console.log("      -", label(a));
    console.log("      -", label(b));
  }

  console.log(`\n=== 3. À regarder, sans forcément éliminer (${review.length}) ===`);
  review.forEach((l) => console.log("  -", l));
}

main();

// npx tsx scripts/audit-wp-users.ts users_migration/preview.json