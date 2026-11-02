import { forgotPasswordSchema } from "@/features/auth/types";
import { authService } from "@/features/auth/services/auth.service";
import { errorResponse } from "@/lib/errors/server/toClientError";
import { NextResponse } from "next/server";

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

  // Anti-énumération : ne lève jamais (compte inexistant, échec base ou SMTP → journalisé seulement)
  await authService.forgotPassword(parsed.data);

  return NextResponse.json(
    { success: true, message: "Reset email sent" },
    { status: 200 }
  );
}
