// scripts/migrate-wp.ts
import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { PrismaClient, type Locale, type Prisma } from "@prisma/client";
import * as z from "zod";

type WpRow = {
  ID: string; user_email: string; user_pass: string; user_registered: string; user_nicename: string;
  first_name: string; last_name: string; billing_first_name: string; billing_last_name: string;
  billing_phone: string; shipping_phone: string; billing_company: string;
  locale: string; capabilities: string;
};

const ALLOWED_ROLES = ["membre"];
const prisma = new PrismaClient();

const clean = (v: string | undefined): string | null => {
  const t = v?.trim();
  return t && t !== "NULL" ? t : null;
};
const toLocale = (v: string | null): Locale => (v?.startsWith("en") ? "en" : "fr");

// Courriels exclus : fautes de frappe (un compte correct existe déjà) et comptes de test
const EXCLUDED_EMAILS = new Set([
  "sinodinos.olivia@gmail.con",
  "sonya.kertland@remax-quebe.comm",
  "alain.velosa@gmaill.com",
  "ferminlopez_@hotmail.com",

  "sguenette@mediasimple.ca",
  "patatefroide@hotmail.com",
  "sguenette@monlieu.ca",
  "ali2@mediasimple.ca",
  "jessica@mediasimple.ca",

  "info@votrequipe.com",
  "info@jeremielavetu.com",
  "yaqiong_612@gmail.com",
  "angela_guarino@hotmail.com",
  "roy.nakhal@gmail.com",
  "btarik@tarikboud.ca",
  "sdazecasavant@gmail.com",
]);

// UTF-8 lu comme Windows-1252 (« LavallÃ©e » → « Lavallée »)
const CP1252: Record<string, number> = {
  "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85, "†": 0x86, "‡": 0x87, "ˆ": 0x88,
  "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c, "Ž": 0x8e, "‘": 0x91, "’": 0x92, "“": 0x93,
  "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b,
  "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f,
};
function fixMojibake(s: string): string {
  if (!/[ÃÂâ]/.test(s)) return s;
  const bytes: number[] = [];
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (code < 0x100) bytes.push(code);
    else if (ch in CP1252) bytes.push(CP1252[ch]);
    else return s;
  }
  const decoded = Buffer.from(bytes).toString("utf8");
  return decoded.includes("\uFFFD") ? s : decoded; // texte déjà correct : inchangé
}

const HTML_ENTITIES: Record<string, string> = { "&amp;": "&", "&quot;": '"', "&#039;": "'", "&lt;": "<", "&gt;": ">" };
const decodeHtml = (s: string) => s.replace(/&(amp|quot|#039|lt|gt);/g, (e) => HTML_ENTITIES[e]);

const text = (v: string | undefined) => {
  const c = clean(v);
  return c ? decodeHtml(fixMojibake(c)) : null;
};

// Entreprise sans contenu réel : « --- », « . », « N/A », URL, numéro de téléphone ou de taxes
const company = (v: string | undefined) => {
  const c = text(v);
  if (!c || /^https?:/i.test(c) || /^n\/?a$/i.test(c)) return null;
  if (!/\p{L}{3}/u.test(c) || c.replace(/\D/g, "").length > 8) return null;
  return c;
};

// Premier numéro trouvé, 10 chiffres sans indicatif ; null si invalide
const phone = (v: string | undefined) => {
  const first = clean(v)?.split("/")[0];
  const digits = first?.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return digits && /^\d{10}$/.test(digits) && !/^\d{3}(\d)\1{6}$/.test(digits) ? digits : null;
};

async function main() {
  const file = process.argv[2];
  const commit = process.argv.includes("--commit");
  if (!file) throw new Error("Usage : npx tsx scripts/migrate-wp.ts <fichier.csv> [--out preview.json] [--commit]");

  const rows: WpRow[] = parse(readFileSync(file), { columns: true, skip_empty_lines: true, bom: true });
  const seen = new Set<string>();
  const skipped: string[] = [];

  const data: Prisma.UserCreateManyInput[] = rows.flatMap((r) => {
    const email = clean(r.user_email)?.toLowerCase();
    if (!email || seen.has(email)) {
      skipped.push(`#${r.ID} courriel vide ou en double`);
      return [];
    }
    if (EXCLUDED_EMAILS.has(email)) {
      skipped.push(`#${r.ID} ${email} — exclu manuellement`);
      return [];
    }
    if (!ALLOWED_ROLES.some((role) => r.capabilities?.includes(`"${role}"`))) {
      skipped.push(`#${r.ID} ${email} — rôle : ${r.capabilities}`);
      return [];
    }
    seen.add(email);
    return [{
      email,
      username: clean(r.user_nicename)?.toLowerCase() ?? null,
      password: clean(r.user_pass),
      firstName: text(r.first_name) ?? text(r.billing_first_name),
      lastName: text(r.last_name) ?? text(r.billing_last_name),
      phoneNumber: clean(r.billing_phone) ?? clean(r.shipping_phone),
      companyName: text(r.billing_company),
      locale: toLocale(clean(r.locale)),
      createdAt: new Date(`${r.user_registered.replace(" ", "T")}Z`),
    }];
  });

  const usernames = data.map((u) => u.username).filter((n): n is string => !!n);
  const dupes = usernames.filter((n, i) => usernames.indexOf(n) !== i);
  if (dupes.length) throw new Error(`Usernames en double : ${[...new Set(dupes)].join(", ")}`);
  
  console.log(`${rows.length} lignes, ${data.length} à importer, ${skipped.length} ignorées`);
  skipped.forEach((s) => console.log("  -", s));

  const emailSchema = z.email();
  const issues = data.flatMap((u) => {
    const problems: string[] = [];
    if (!emailSchema.safeParse(u.email).success) problems.push("courriel invalide");
    const texts = [u.firstName, u.lastName, u.companyName].filter(Boolean).join(" ");
    if (/&[a-z#0-9]+;/i.test(texts)) problems.push("entité HTML");
    if (/Ã|Â|â€/.test(texts)) problems.push("accents corrompus");
    if (/\d/.test(`${u.firstName ?? ""}${u.lastName ?? ""}`)) problems.push("chiffre dans le nom");
    const digits = u.phoneNumber?.replace(/\D/g, "") ?? "";
    if (u.phoneNumber && !/^1?\d{10}$/.test(digits)) problems.push(`téléphone « ${u.phoneNumber} »`);
    return problems.length ? [`${u.email} : ${problems.join(", ")}`] : [];
  });
  console.log(`${issues.length} comptes à vérifier`);
  issues.forEach((i) => console.log("  -", i));

  const missing = (key: keyof Prisma.UserCreateManyInput) => data.filter((u) => !u[key]).length;
  console.log(
    `Sans prénom : ${missing("firstName")} · sans nom : ${missing("lastName")} · ` +
    `sans téléphone : ${missing("phoneNumber")} · sans entreprise : ${missing("companyName")} · ` +
    `sans mot de passe : ${missing("password")} · en anglais : ${data.filter((u) => u.locale === "en").length}`,
  );

  const outIndex = process.argv.indexOf("--out");
  const outFile = outIndex !== -1 ? process.argv[outIndex + 1] : undefined;
  if (outFile) {
    const preview = data.map(({ password, ...user }) => ({
      ...user,
      passwordFormat: password?.slice(0, 4) ?? null, // aucun hash dans l'aperçu
    }));
    writeFileSync(outFile, JSON.stringify(preview, null, 2), "utf8");
    console.log(`Aperçu écrit dans ${outFile}`);
  }

  if (!commit) {
    console.log("Aperçu seulement. Ajoute --commit pour écrire dans la base.");
    return;
  }

  const { count } = await prisma.user.createMany({ data, skipDuplicates: true });
  console.log(`${count} créés, ${data.length - count} déjà présents`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());


// Ceci est la commande a utiliser pour générer un aperçu des comptes WordPress à migrer vers la base de données Prisma :
// npx tsx --env-file=.env.local scripts/migrate-wp.ts users_migration/users.csv --out users_migration/preview.json

// Ceci est la commande a utiliser pour migrer les comptes WordPress vers la base de données Prisma :
// npx tsx --env-file=.env.local scripts/migrate-wp.ts users_migration/users.csv --commit