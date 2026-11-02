import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/features/auth/services/auth.service";
import { verifyEmailSchema } from "@/features/auth/types";
import { errorResponse } from "@/lib/errors/server/toClientError";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    const validatedData = verifyEmailSchema.parse(body);

    // Vérifier et créer l'user
    const user = await authService.verifyEmailAndCreateUser(
      validatedData.email,
      validatedData.code,
      validatedData.firstName,
      validatedData.lastName,
      validatedData.password,
      validatedData.phoneNumber,
      validatedData.companyName,
      validatedData.groupStatus,
      validatedData.locale
    );

    return NextResponse.json(
      { user, message: "Email verified and user created" },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error, "verify-email");
  }
}
