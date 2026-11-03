import { forgotPasswordSchema } from "@/features/auth/types";
import { authService } from "@/lib/auth/server/auth.service";
import { errorResponse } from "@/lib/errors/server/toClientError";
import { after, NextResponse } from "next/server";

export async function POST(req: Request) {
  // Seule une requête invalide (JSON, Zod) renvoie une erreur : indépendant de l'existence du compte
  let body: unknown;
  try {
    body = await req.json();
  } catch (error: unknown) {
    return errorResponse(error, "forgot-password");
  }
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error, "forgot-password");

  // Anti-énumération : exécuté après la réponse, pour que le temps de réponse ne dépende pas de
  // l'existence du compte (envoi SMTP) ; ne lève jamais (échecs base ou SMTP → journalisés seulement)
  const data = parsed.data;
  after(() => authService.forgotPassword(data));

  return NextResponse.json(
    { success: true, message: "Reset email sent" },
    { status: 200 }
  );
}
