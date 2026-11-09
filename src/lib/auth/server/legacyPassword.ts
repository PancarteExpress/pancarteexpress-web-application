import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { bcryptCompare } from "./password";

const ITOA64 = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** Hash importé de WordPress : phpass ($P$) ou bcrypt pré-haché de WP ≥ 6.8 ($wp$). */
export const isLegacyHash = (hash: string): boolean =>
  hash.startsWith("$P$") || hash.startsWith("$wp$");

// Port de PasswordHash::encode64 (phpass)
function encode64(input: Buffer, count: number): string {
  let out = "";
  let i = 0;
  do {
    let value = input[i++];
    out += ITOA64[value & 0x3f];
    if (i < count) value |= input[i] << 8;
    out += ITOA64[(value >> 6) & 0x3f];
    if (i++ >= count) break;
    if (i < count) value |= input[i] << 16;
    out += ITOA64[(value >> 12) & 0x3f];
    if (i++ >= count) break;
    out += ITOA64[(value >> 18) & 0x3f];
  } while (i < count);
  return out;
}

function checkPhpass(password: string, hash: string): boolean {
  const countLog2 = ITOA64.indexOf(hash[3]);
  if (hash.length !== 34 || countLog2 < 7 || countLog2 > 30) return false;
  const pwd = Buffer.from(password, "utf8");
  let h = createHash("md5").update(hash.slice(4, 12)).update(pwd).digest();
  for (let i = 0; i < 2 ** countLog2; i++) {
    h = createHash("md5").update(h).update(pwd).digest();
  }
  const expected = Buffer.from(hash.slice(0, 12) + encode64(h, 16));
  const actual = Buffer.from(hash);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function verifyLegacyPassword(password: string, hash: string): Promise<boolean> {
  const pwd = password.trim(); // WordPress retire les espaces avant de hacher
  if (hash.startsWith("$P$")) return checkPhpass(pwd, hash);
  const prehash = createHmac("sha384", "wp-sha384").update(pwd).digest("base64");
  return bcryptCompare(prehash, hash.slice(3).replace(/^\$2y\$/, "$2b$"));
}

/** Vérifie un mot de passe, quel que soit le format du hash (bcrypt ou WordPress). */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return isLegacyHash(hash) ? verifyLegacyPassword(password, hash) : bcryptCompare(password, hash);
}