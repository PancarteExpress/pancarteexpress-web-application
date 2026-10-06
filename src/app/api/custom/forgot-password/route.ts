import { forgotPasswordSchema } from "@/features/auth/types";
import { authService } from "@/features/auth/services/auth.service";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    
    const body: unknown = await req.json();
    const data = forgotPasswordSchema.parse(body);

    await authService.forgotPassword(data);

    return NextResponse.json(
      { success: true, message: "Reset email sent" },
      { status: 200 }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}