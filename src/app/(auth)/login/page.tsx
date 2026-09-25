import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function AuthLoginPage() {
  const headersList = await headers();
  const locale = headersList.get("x-locale") || "fr";
  
  redirect(`/${locale}/auth/login`);
}