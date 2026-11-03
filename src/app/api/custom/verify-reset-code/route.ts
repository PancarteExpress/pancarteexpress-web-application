import { authService } from "@/lib/auth/server/auth.service";
import { errorResponse } from "@/lib/errors/server/toClientError";
import { NextResponse } from "next/server";
import { verifyResetCodeSchema } from "@/lib/auth/auth.schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const data = verifyResetCodeSchema.parse(body);

    await authService.verifyResetCode(data.email, data.code);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    return errorResponse(error, "verify-reset-code");
  }
}
