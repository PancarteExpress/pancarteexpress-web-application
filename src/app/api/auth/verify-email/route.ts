import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authService } from "@/features/auth/services/auth.service";
import { verifyEmailSchema } from "@/features/auth/types";

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
      validatedData.isGroup || false,
      validatedData.groupName
    );

    return NextResponse.json(
      { user, message: "Email verified and user created" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Verification failed";

    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}