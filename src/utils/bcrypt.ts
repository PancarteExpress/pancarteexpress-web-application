import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function bcryptCompare(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}