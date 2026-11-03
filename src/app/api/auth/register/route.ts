import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/auth/auth.schema";
import { authService } from "@/lib/auth/server/auth.service";
import { errorResponse } from "@/lib/errors/server/toClientError";

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
    return errorResponse(error, "register");
  }
}
