import { authService } from "@/features/auth/services/auth.service";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d{6}$/, "Code must contain only digits"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const data = schema.parse(body);

    await authService.verifyResetCode(data.email, data.code);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}