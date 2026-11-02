import { authService } from "@/features/auth/services/auth.service";
import { errorResponse } from "@/lib/errors/server/toClientError";
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
    return errorResponse(error, "verify-reset-code");
  }
}
