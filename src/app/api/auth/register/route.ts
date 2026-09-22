import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/features/auth/types";
import { authService } from "@/features/auth/services/auth.service";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    const validatedData = registerSchema.parse(body);

    // Register
    const user = await authService.register(validatedData);

    return NextResponse.json(
      { user, message: "Registration successful" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Registration failed";

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}