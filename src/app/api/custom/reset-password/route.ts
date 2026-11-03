import { authService } from "@/lib/auth/server/auth.service";
import { resetPasswordRequestSchema } from "@/lib/auth/auth.schema";
import { errorResponse } from "@/lib/errors/server/toClientError";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const data = resetPasswordRequestSchema.parse(body);

    await authService.resetPassword(data);

    return NextResponse.json(
      { success: true, message: "Password reset successfully" },
      { status: 200 },
    );
  } catch (error: unknown) {
    return errorResponse(error, "reset-password");
  }
}
