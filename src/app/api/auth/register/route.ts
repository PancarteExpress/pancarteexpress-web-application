import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/auth/auth.schema";
import { authService } from "@/lib/auth/server/auth.service";
import { errorResponse } from "@/lib/errors/server/toClientError";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    const validatedData = registerSchema.parse(body);

    // Envoie le code de vérification : aucun compte n'est encore créé à cette étape
    const result = await authService.register(validatedData);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return errorResponse(error, "register");
  }
}