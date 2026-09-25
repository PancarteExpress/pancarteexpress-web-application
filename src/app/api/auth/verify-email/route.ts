import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authService } from "@/features/auth/services/auth.service";

const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Code must be 6 digits"),
  name: z.string().min(2),
  password: z.string().min(8),
  isGroup: z.boolean().optional(),
  groupName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    const validatedData = verifyEmailSchema.parse(body);

    // Vérifier et créer l'user
    const user = await authService.verifyEmailAndCreateUser(
      validatedData.email,
      validatedData.code,
      validatedData.name,
      validatedData.password,
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